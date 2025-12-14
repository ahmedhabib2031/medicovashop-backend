import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './entities/order.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { CustomerAddress, CustomerAddressDocument } from '../customer-addresses/entities/customer-address.entity';
import { Discount, DiscountDocument } from '../coupons/entities/coupon.entity';
import { ProductInventory, ProductInventoryDocument } from '../inventory/entities/product-inventory.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(CustomerAddress.name)
    private addressModel: Model<CustomerAddressDocument>,
    @InjectModel(Discount.name) private discountModel: Model<DiscountDocument>,
    @InjectModel(ProductInventory.name)
    private inventoryModel: Model<ProductInventoryDocument>,
  ) {}

  async create(dto: CreateOrderDto, customerId: string): Promise<Order> {
    // Validate shipping address belongs to customer
    const shippingAddress = await this.addressModel.findOne({
      _id: dto.shippingAddressId,
      userId: customerId,
    });
    if (!shippingAddress) {
      throw new NotFoundException('SHIPPING_ADDRESS_NOT_FOUND');
    }

    // Validate and process order items
    const orderItems = [];
    let subtotal = 0;
    const sellerIds = new Set<string>();

    for (const itemDto of dto.items) {
      // Get product
      const product = await this.productModel.findById(itemDto.productId);
      if (!product) {
        throw new NotFoundException(`PRODUCT_NOT_FOUND: ${itemDto.productId}`);
      }

      if (!product.active) {
        throw new BadRequestException(`PRODUCT_NOT_ACTIVE: ${product.nameEn}`);
      }

      // Track seller ID
      if (product.sellerId) {
        sellerIds.add(product.sellerId.toString());
      }

      // Validate quantity against stock
      if (itemDto.quantity > product.stockQuantity) {
        throw new BadRequestException(
          `INSUFFICIENT_STOCK: ${product.nameEn} - Available: ${product.stockQuantity}, Requested: ${itemDto.quantity}`,
        );
      }

      // Validate size and colors if provided
      if (itemDto.size && !product.sizes.includes(itemDto.size)) {
        throw new BadRequestException(`INVALID_SIZE: ${itemDto.size} not available for ${product.nameEn}`);
      }

      if (itemDto.colors && itemDto.colors.length > 0) {
        for (const color of itemDto.colors) {
          if (!product.colors.includes(color)) {
            throw new BadRequestException(`INVALID_COLOR: ${color} not available for ${product.nameEn}`);
          }
        }
      }

      // Check inventory if variant is specified
      if (itemDto.size || (itemDto.colors && itemDto.colors.length > 0)) {
        const inventory = await this.inventoryModel.findOne({
          productId: itemDto.productId,
        });

        if (inventory) {
          const variant = inventory.variants.find(
            (v) =>
              v.size === itemDto.size &&
              v.colors.sort().join(',') === (itemDto.colors || []).sort().join(','),
          );

          if (!variant) {
            throw new BadRequestException(
              `VARIANT_NOT_FOUND: Size ${itemDto.size}, Colors ${itemDto.colors?.join(', ')} not available`,
            );
          }

          if (itemDto.quantity > variant.quantity) {
            throw new BadRequestException(
              `INSUFFICIENT_VARIANT_STOCK: Available: ${variant.quantity}, Requested: ${itemDto.quantity}`,
            );
          }
        }
      }

      // Calculate item price (use sale price if available and within date range)
      let unitPrice = product.originalPrice;
      // Check discount - handle both discountType (DB field) and type (API field)
      const discount = product.discount as any;
      if (
        product.salePrice &&
        discount &&
        discount.startDate &&
        discount.endDate &&
        new Date() >= discount.startDate &&
        new Date() <= discount.endDate
      ) {
        unitPrice = product.salePrice;
      }

      // Get variant price from inventory if available
      if (itemDto.size || (itemDto.colors && itemDto.colors.length > 0)) {
        const inventory = await this.inventoryModel.findOne({
          productId: itemDto.productId,
        });

        if (inventory) {
          const variant = inventory.variants.find(
            (v) =>
              v.size === itemDto.size &&
              v.colors.sort().join(',') === (itemDto.colors || []).sort().join(','),
          );

          if (variant && variant.attributes && variant.attributes.price) {
            unitPrice = variant.attributes.price;
          }
        }
      }

      const itemSubtotal = unitPrice * itemDto.quantity;
      subtotal += itemSubtotal;

      // Build order item
      orderItems.push({
        productId: product._id,
        productName: product.nameEn,
        productNameAr: product.nameAr,
        sku: product.sku,
        quantity: itemDto.quantity,
        size: itemDto.size || null,
        colors: itemDto.colors || [],
        unitPrice,
        discount: 0, // Will be calculated after coupon application
        subtotal: itemSubtotal,
        productImage: product.featuredImages?.[0] || product.galleryImages?.[0] || null,
      });
    }

    // Validate coupon if provided
    let coupon = null;
    let discountAmount = 0;
    let couponId = null;
    let couponCode = null;

    if (dto.couponCode) {
      coupon = await this.discountModel.findOne({
        discountCode: dto.couponCode,
        active: true,
      });

      if (!coupon) {
        throw new NotFoundException('COUPON_NOT_FOUND');
      }

      // Check if coupon is active (date/time validation)
      const now = new Date();
      if (coupon.startDate && now < coupon.startDate) {
        throw new BadRequestException('COUPON_NOT_YET_ACTIVE');
      }

      if (coupon.endDate && now > coupon.endDate) {
        throw new BadRequestException('COUPON_EXPIRED');
      }

      // Check eligibility
      if (coupon.eligibility === 'specific_customers') {
        const customerObjectId = customerId as any;
        if (!coupon.customerIds.some((id) => id.toString() === customerId)) {
          throw new ForbiddenException('COUPON_NOT_ELIGIBLE');
        }
      }

      // Check if coupon applies to products in order
      const orderProductIds = dto.items.map((item) => item.productId);
      let appliesToOrder = false;

      if (coupon.appliesTo === 'all_products') {
        appliesToOrder = true;
      } else if (coupon.appliesTo === 'specific_products') {
        appliesToOrder = orderProductIds.some((id) =>
          coupon.productIds.some((pid) => pid.toString() === id),
        );
      } else if (coupon.appliesTo === 'specific_categories') {
        // Get products and check categories
        const products = await this.productModel.find({
          _id: { $in: orderProductIds },
        });
        appliesToOrder = products.some((p) =>
          coupon.categoryIds.includes(p.category.toString()),
        );
      } else if (coupon.appliesTo === 'specific_subcategories') {
        const products = await this.productModel.find({
          _id: { $in: orderProductIds },
        });
        appliesToOrder = products.some((p) =>
          coupon.subcategoryIds.includes(p.subcategory.toString()),
        );
      }

      if (!appliesToOrder) {
        throw new BadRequestException('COUPON_NOT_APPLICABLE_TO_PRODUCTS');
      }

      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
      } else {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }

      couponId = coupon._id;
      couponCode = coupon.discountCode;

      // Apply discount proportionally to items
      const discountRatio = discountAmount / subtotal;
      orderItems.forEach((item) => {
        item.discount = item.subtotal * discountRatio;
        item.subtotal -= item.discount;
      });
    }

    // Calculate totals
    const shippingCost = 0; // TODO: Calculate based on shipping rules
    const tax = 0; // TODO: Calculate based on tax rules
    const total = subtotal - discountAmount + shippingCost + tax;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Determine seller ID (if all products from same seller)
    const sellerId = sellerIds.size === 1 ? Array.from(sellerIds)[0] : null;

    // Create order
    const order = new this.orderModel({
      orderNumber,
      customerId,
      items: orderItems,
      shippingAddressId: dto.shippingAddressId,
      subtotal,
      discountAmount,
      couponId,
      couponCode,
      shippingCost,
      tax,
      total,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
      customerNotes: dto.customerNotes || null,
      sellerId,
    });

    const savedOrder = await order.save();

    // Update inventory (reduce stock)
    for (const itemDto of dto.items) {
      const product = await this.productModel.findById(itemDto.productId);
      if (product) {
        product.stockQuantity -= itemDto.quantity;
        await product.save();
      }

      // Update variant inventory if applicable
      if (itemDto.size || (itemDto.colors && itemDto.colors.length > 0)) {
        const inventory = await this.inventoryModel.findOne({
          productId: itemDto.productId,
        });

        if (inventory) {
          const variant = inventory.variants.find(
            (v) =>
              v.size === itemDto.size &&
              v.colors.sort().join(',') === (itemDto.colors || []).sort().join(','),
          );

          if (variant) {
            variant.quantity -= itemDto.quantity;
            inventory.totalQuantity -= itemDto.quantity;
            await inventory.save();
          }
        }
      }
    }

    return savedOrder.populate([
      { path: 'customerId', select: 'firstName lastName email phone' },
      { path: 'shippingAddressId' },
      { path: 'couponId' },
      { path: 'items.productId', select: 'nameEn nameAr sku' },
    ]);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
    customerId?: string,
    sellerId?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (customerId) {
      query.customerId = customerId;
    }

    if (status) {
      query.status = status;
    }

    if (sellerId) {
      // Find orders that contain products from this seller
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      const productIds = sellerProducts.map((p) => p._id);

      query.$or = [
        { sellerId },
        { 'items.productId': { $in: productIds } },
      ];
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('customerId', 'firstName lastName email phone')
        .populate('shippingAddressId')
        .populate('couponId', 'discountName discountCode discountType discountValue')
        .populate('items.productId', 'nameEn nameAr sku featuredImages galleryImages')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, customerId?: string, sellerId?: string): Promise<Order> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    // Check access permissions
    if (customerId && order.customerId.toString() !== customerId) {
      throw new ForbiddenException('ORDER_ACCESS_DENIED');
    }

    if (sellerId) {
      // Check if seller owns any product in the order
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      const productIds = sellerProducts.map((p) => p._id);

      const hasProduct = order.items.some((item) =>
        productIds.some((pid) => pid.toString() === item.productId.toString()),
      );

      if (!hasProduct && order.sellerId?.toString() !== sellerId) {
        throw new ForbiddenException('ORDER_ACCESS_DENIED');
      }
    }

    await order.populate([
      { path: 'customerId', select: 'firstName lastName email phone' },
      { path: 'shippingAddressId' },
      { path: 'couponId', select: 'discountName discountCode discountType discountValue' },
      { path: 'items.productId', select: 'nameEn nameAr sku featuredImages galleryImages' },
    ]);

    return order;
  }

  async update(id: string, dto: UpdateOrderDto, customerId?: string): Promise<Order> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    // Only allow updates if order is pending
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('ORDER_CANNOT_BE_UPDATED');
    }

    // Check access
    if (customerId && order.customerId.toString() !== customerId) {
      throw new ForbiddenException('ORDER_ACCESS_DENIED');
    }

    // Update allowed fields
    if (dto.shippingAddressId) {
      const address = await this.addressModel.findOne({
        _id: dto.shippingAddressId,
        userId: order.customerId.toString(),
      });
      if (!address) {
        throw new NotFoundException('SHIPPING_ADDRESS_NOT_FOUND');
      }
      order.shippingAddressId = dto.shippingAddressId as any;
    }

    if (dto.customerNotes !== undefined) {
      order.customerNotes = dto.customerNotes;
    }

    return order.save();
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    sellerId?: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    // Check seller access if sellerId provided
    if (sellerId) {
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      const productIds = sellerProducts.map((p) => p._id);

      const hasProduct = order.items.some((item) =>
        productIds.some((pid) => pid.toString() === item.productId.toString()),
      );

      if (!hasProduct && order.sellerId?.toString() !== sellerId) {
        throw new ForbiddenException('ORDER_ACCESS_DENIED');
      }
    }

    // Update status
    if (dto.status) {
      const oldStatus = order.status;
      order.status = dto.status;

      // Set timestamps based on status
      if (dto.status === OrderStatus.CONFIRMED && !order.confirmedAt) {
        order.confirmedAt = new Date();
      } else if (dto.status === OrderStatus.SHIPPED && !order.shippedAt) {
        order.shippedAt = new Date();
      } else if (dto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
        order.deliveredAt = new Date();
      } else if (dto.status === OrderStatus.CANCELLED && !order.cancelledAt) {
        order.cancelledAt = new Date();
        order.cancellationReason = dto.cancellationReason || null;

        // Restore inventory if cancelled
        if (oldStatus !== OrderStatus.CANCELLED) {
          await this.restoreInventory(order);
        }
      }
    }

    // Update payment status
    if (dto.paymentStatus) {
      order.paymentStatus = dto.paymentStatus;
      if (dto.paymentStatus === PaymentStatus.PAID && !order.paidAt) {
        order.paidAt = new Date();
      }
    }

    // Update shipping info
    if (dto.trackingNumber) {
      order.trackingNumber = dto.trackingNumber;
    }

    if (dto.shippingCarrier) {
      order.shippingCarrier = dto.shippingCarrier;
    }

    if (dto.estimatedDeliveryDate) {
      order.estimatedDeliveryDate = dto.estimatedDeliveryDate;
    }

    // Update admin notes
    if (dto.adminNotes !== undefined) {
      order.adminNotes = dto.adminNotes;
    }

    return order.save();
  }

  async remove(id: string, customerId?: string): Promise<void> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    // Only allow deletion if order is pending or cancelled
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('ORDER_CANNOT_BE_DELETED');
    }

    // Check access
    if (customerId && order.customerId.toString() !== customerId) {
      throw new ForbiddenException('ORDER_ACCESS_DENIED');
    }

    // Restore inventory if not already cancelled
    if (order.status !== OrderStatus.CANCELLED) {
      await this.restoreInventory(order);
    }

    await this.orderModel.findByIdAndDelete(id);
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Check if order number already exists (very unlikely but check anyway)
    const existing = await this.orderModel.findOne({ orderNumber });
    if (existing) {
      return this.generateOrderNumber(); // Recursively generate new one
    }

    return orderNumber;
  }

  private async restoreInventory(order: Order): Promise<void> {
    for (const item of order.items) {
      // Restore product stock
      const product = await this.productModel.findById(item.productId);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }

      // Restore variant inventory if applicable
      if (item.size || (item.colors && item.colors.length > 0)) {
        const inventory = await this.inventoryModel.findOne({
          productId: item.productId,
        });

        if (inventory) {
          const variant = inventory.variants.find(
            (v) =>
              v.size === item.size &&
              v.colors.sort().join(',') === (item.colors || []).sort().join(','),
          );

          if (variant) {
            variant.quantity += item.quantity;
            inventory.totalQuantity += item.quantity;
            await inventory.save();
          }
        }
      }
    }
  }
}
