import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './entities/cart.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import {
  ProductInventory,
  ProductInventoryDocument,
} from '../inventory/entities/product-inventory.entity';
import { CreateCartDto, CartItemDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddItemToCartDto } from './dto/add-item-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductInventory.name)
    private inventoryModel: Model<ProductInventoryDocument>,
  ) {}

  async create(userId: string, createCartDto: CreateCartDto): Promise<Cart> {
    // Check if cart already exists for user
    let cart = await this.cartModel.findOne({ userId });
    if (cart) {
      throw new BadRequestException('CART_ALREADY_EXISTS');
    }

    // Process items and calculate totals
    const { items, totals } = await this.processCartItems(
      createCartDto.items,
      createCartDto.couponCode,
    );

    cart = new this.cartModel({
      userId,
      items,
      ...totals,
    });

    return cart.save();
  }

  async findAll(userId?: string): Promise<Cart[]> {
    const query = userId ? { userId } : {};
    return this.cartModel.find(query).populate('userId', 'name email').exec();
  }

  async findOne(userId: string): Promise<Cart> {
    const cart = await this.cartModel
      .findOne({ userId })
      .populate('items.productId', 'nameEn nameAr sku')
      .populate('items.inventoryId')
      .exec();

    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND');
    }

    return cart;
  }

  async addItem(userId: string, addItemDto: AddItemToCartDto): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId });

    if (!cart) {
      // Create new cart with this item
      const createDto: CreateCartDto = {
        items: [
          {
            productId: addItemDto.productId,
            inventoryId: addItemDto.inventoryId,
            variantId: addItemDto.variantId,
            quantity: addItemDto.quantity,
            size: addItemDto.size,
            colors: addItemDto.colors,
          },
        ],
      };
      return this.create(userId, createDto);
    }

    // Process the new item
    const { items: newItems } = await this.processCartItems([addItemDto]);

    // Check if item already exists (same product, variant, size, colors)
    const existingItemIndex = cart.items.findIndex((item) => {
      const productMatch =
        item.productId.toString() === addItemDto.productId;
      const variantMatch = addItemDto.variantId
        ? item.variantId?.toString() === addItemDto.variantId
        : !item.variantId;
      const sizeMatch = item.size === (addItemDto.size || null);
      const colorsMatch =
        JSON.stringify(item.colors.sort()) ===
        JSON.stringify((addItemDto.colors || []).sort());

      return productMatch && variantMatch && sizeMatch && colorsMatch;
    });

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += newItems[0].quantity;
      cart.items[existingItemIndex].subtotal =
        cart.items[existingItemIndex].unitPrice *
          cart.items[existingItemIndex].quantity -
        cart.items[existingItemIndex].discount;
    } else {
      // Add new item
      cart.items.push(newItems[0]);
    }

    // Recalculate totals
    await this.recalculateTotals(cart);

    return cart.save();
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item._id?.toString() === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('CART_ITEM_NOT_FOUND');
    }

    if (updateDto.quantity !== undefined) {
      // Validate inventory availability
      const item = cart.items[itemIndex];
      if (item.inventoryId) {
        const inventory = await this.inventoryModel.findById(
          item.inventoryId,
        );
        if (inventory) {
          if (item.variantId) {
            const variant = inventory.variants.find(
              (v: any) => v._id.toString() === item.variantId.toString(),
            );
            if (variant && updateDto.quantity > variant.quantity) {
              throw new BadRequestException('INSUFFICIENT_STOCK');
            }
          } else if (updateDto.quantity > inventory.totalQuantity) {
            throw new BadRequestException('INSUFFICIENT_STOCK');
          }
        }
      }

      cart.items[itemIndex].quantity = updateDto.quantity;
      cart.items[itemIndex].subtotal =
        cart.items[itemIndex].unitPrice * updateDto.quantity -
        cart.items[itemIndex].discount;
    }

    await this.recalculateTotals(cart);

    return cart.save();
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item._id?.toString() === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('CART_ITEM_NOT_FOUND');
    }

    cart.items.splice(itemIndex, 1);

    await this.recalculateTotals(cart);

    return cart.save();
  }

  async update(userId: string, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND');
    }

    if (updateCartDto.items) {
      const { items, totals } = await this.processCartItems(
        updateCartDto.items,
        updateCartDto.couponCode || cart.couponCode || undefined,
      );
      cart.items = items;
      Object.assign(cart, totals);
    }

    if (updateCartDto.couponCode !== undefined) {
      // Apply or remove coupon
      await this.recalculateTotals(cart, updateCartDto.couponCode);
    }

    return cart.save();
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND');
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.discountAmount = 0;
    cart.couponId = null;
    cart.couponCode = null;
    cart.shippingCost = 0;
    cart.tax = 0;
    cart.total = 0;

    return cart.save();
  }

  async remove(userId: string): Promise<void> {
    const cart = await this.cartModel.findOneAndDelete({ userId });
    if (!cart) {
      throw new NotFoundException('CART_NOT_FOUND');
    }
  }

  private async processCartItems(
    items: CartItemDto[],
    couponCode?: string,
  ): Promise<{
    items: any[];
    totals: {
      subtotal: number;
      discountAmount: number;
      couponId: Types.ObjectId | null;
      couponCode: string | null;
      shippingCost: number;
      tax: number;
      total: number;
    };
  }> {
    const processedItems: any[] = [];
    let subtotal = 0;

    for (const itemDto of items) {
      // Get product
      const product = await this.productModel.findById(itemDto.productId);
      if (!product) {
        throw new NotFoundException(
          `PRODUCT_NOT_FOUND: ${itemDto.productId}`,
        );
      }

      // Get inventory and variant if provided
      let inventory: ProductInventoryDocument | null = null;
      let variant: any = null;
      let unitPrice = product.salePrice || product.originalPrice;
      let variantImage: string | null = null;

      if (itemDto.inventoryId) {
        inventory = await this.inventoryModel.findById(itemDto.inventoryId);
        if (!inventory) {
          throw new NotFoundException(
            `INVENTORY_NOT_FOUND: ${itemDto.inventoryId}`,
          );
        }

        // Check stock availability
        if (itemDto.variantId) {
          variant = inventory.variants.find(
            (v: any) => v._id.toString() === itemDto.variantId,
          );
          if (!variant) {
            throw new NotFoundException(
              `VARIANT_NOT_FOUND: ${itemDto.variantId}`,
            );
          }
          if (variant.quantity < itemDto.quantity) {
            throw new BadRequestException('INSUFFICIENT_STOCK');
          }
          variantImage = variant.image || null;
          // Use variant price if available in attributes
          if (variant.attributes?.price) {
            unitPrice = variant.attributes.price;
          }
        } else {
          if (inventory.totalQuantity < itemDto.quantity) {
            throw new BadRequestException('INSUFFICIENT_STOCK');
          }
        }
      } else {
        // Check product stock
        if (product.stockQuantity < itemDto.quantity) {
          throw new BadRequestException('INSUFFICIENT_STOCK');
        }
      }

      const itemSubtotal = unitPrice * itemDto.quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        productId: itemDto.productId,
        inventoryId: itemDto.inventoryId || null,
        variantId: itemDto.variantId || null,
        productName: product.nameEn,
        productNameAr: product.nameAr,
        sku: product.sku,
        quantity: itemDto.quantity,
        size: itemDto.size || variant?.size || null,
        colors: itemDto.colors || variant?.colors || [],
        variantImage,
        unitPrice,
        discount: 0,
        subtotal: itemSubtotal,
      });
    }

    // Calculate totals (coupon logic would go here)
    const discountAmount = 0; // TODO: Apply coupon if provided
    const couponId = null;
    const shippingCost = 0; // TODO: Calculate shipping
    const tax = 0; // TODO: Calculate tax
    const total = subtotal - discountAmount + shippingCost + tax;

    return {
      items: processedItems,
      totals: {
        subtotal,
        discountAmount,
        couponId,
        couponCode: couponCode || null,
        shippingCost,
        tax,
        total,
      },
    };
  }

  private async recalculateTotals(
    cart: CartDocument,
    couponCode?: string,
  ): Promise<void> {
    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

    // TODO: Apply coupon if provided
    const discountAmount = 0;
    const shippingCost = 0; // TODO: Calculate shipping
    const tax = 0; // TODO: Calculate tax
    const total = subtotal - discountAmount + shippingCost + tax;

    cart.subtotal = subtotal;
    cart.discountAmount = discountAmount;
    cart.shippingCost = shippingCost;
    cart.tax = tax;
    cart.total = total;

    if (couponCode !== undefined) {
      cart.couponCode = couponCode || null;
      // TODO: Find and set couponId
    }
  }
}
