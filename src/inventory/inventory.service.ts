import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProductInventory,
  ProductInventoryDocument,
} from './entities/product-inventory.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateInventoryStatusDto } from './dto/update-inventory-status.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(ProductInventory.name)
    private inventoryModel: Model<ProductInventoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    dto: CreateInventoryDto,
    sellerId?: string,
  ): Promise<ProductInventory> {
    // Check if product exists
    const product = await this.productModel.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    // Check if seller owns the product (if sellerId is provided)
    if (sellerId && product.sellerId?.toString() !== sellerId) {
      throw new BadRequestException('PRODUCT_NOT_OWNED_BY_SELLER');
    }

    // Check if inventory already exists for this product
    const existingInventory = await this.inventoryModel.findOne({
      productId: dto.productId,
    });
    if (existingInventory) {
      throw new BadRequestException('INVENTORY_ALREADY_EXISTS');
    }

    // Validate variants
    this.validateVariants(dto.variants, product);

    // Calculate total quantity
    const totalQuantity = dto.variants.reduce(
      (sum, variant) => sum + variant.quantity,
      0,
    );

    // Check if total quantity exceeds product stock
    if (totalQuantity > product.stockQuantity) {
      throw new BadRequestException('INVENTORY_EXCEEDS_PRODUCT_STOCK');
    }

    // Check for duplicate variant combinations
    const variantKeys = dto.variants.map(
      (v) => `${v.size}:${v.colors.sort().join(',')}`,
    );
    const uniqueKeys = new Set(variantKeys);
    if (variantKeys.length !== uniqueKeys.size) {
      throw new BadRequestException('DUPLICATE_VARIANT_COMBINATIONS');
    }

    const inventory = new this.inventoryModel({
      productId: dto.productId,
      variants: dto.variants,
      totalQuantity,
    });

    return inventory.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    productId?: string,
    sellerId?: string,
    status?: string,
    minQuantity?: number,
    maxQuantity?: number,
    sellerStatus?: string,
    qaStatus?: string,
    brandId?: string,
    categoryId?: string,
    subcategoryId?: string,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Build product filter to apply before filtering inventory
    const productFilter: any = {};

    if (productId) {
      query.productId = productId;
    }

    // Filter by brand
    if (brandId) {
      productFilter.brand = brandId;
    }

    // Filter by category
    if (categoryId) {
      productFilter.category = categoryId;
    }

    // Filter by subcategory
    if (subcategoryId) {
      productFilter.subcategory = subcategoryId;
    }

    // Filter by QA status (if qaStatus field exists on Product)
    if (qaStatus) {
      productFilter.qaStatus = qaStatus;
    }

    // Filter by price range
    // Use salePrice if available, otherwise use originalPrice
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {
        $or: [
          // Products with salePrice in range
          {
            salePrice: {
              ...(minPrice !== undefined && { $gte: minPrice }),
              ...(maxPrice !== undefined && { $lte: maxPrice }),
              $ne: null,
            },
          },
          // Products without salePrice, check originalPrice
          {
            $and: [
              { $or: [{ salePrice: null }, { salePrice: { $exists: false } }] },
              {
                originalPrice: {
                  ...(minPrice !== undefined && { $gte: minPrice }),
                  ...(maxPrice !== undefined && { $lte: maxPrice }),
                },
              },
            ],
          },
        ],
      };

      if (productFilter.$or) {
        // Combine with existing $or (from search)
        productFilter.$and = [{ $or: productFilter.$or }, priceFilter];
        delete productFilter.$or;
      } else {
        Object.assign(productFilter, priceFilter);
      }
    }

    // Filter by rating (if rating field exists on Product)
    if (minRating !== undefined) {
      productFilter.rating = { $gte: minRating };
    }

    // Filter by seller status (active/inactive)
    if (sellerStatus) {
      const isActive = sellerStatus === 'active';
      const activeSellers = await this.userModel
        .find({ role: 'seller', active: isActive })
        .select('_id');
      const sellerIds = activeSellers.map((s) => s._id);
      productFilter.sellerId = { $in: sellerIds };
    }

    // Apply sellerId filter if provided (for seller role)
    if (sellerId) {
      if (productFilter.sellerId) {
        // Combine with existing sellerId filter
        const existingSellerIds = Array.isArray(productFilter.sellerId.$in)
          ? productFilter.sellerId.$in
          : [productFilter.sellerId];
        productFilter.sellerId = {
          $in: existingSellerIds.filter(
            (id) => id.toString() === sellerId.toString(),
          ),
        };
      } else {
        productFilter.sellerId = sellerId;
      }
    }

    // Apply product filters to get product IDs
    if (Object.keys(productFilter).length > 0 || search) {
      const searchFilter: any = { ...productFilter };

      if (search) {
        searchFilter.$or = [
          { nameEn: { $regex: search, $options: 'i' } },
          { nameAr: { $regex: search, $options: 'i' } },
        ];
      }

      const products = await this.productModel.find(searchFilter).select('_id');
      const productIds = products.map((p) => p._id);

      if (productIds.length === 0) {
        // No products match the filter, return empty result
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Combine with existing productId filter
      if (query.productId) {
        if (query.productId.$in) {
          query.productId.$in = query.productId.$in.filter((id: any) =>
            productIds.some((pid) => pid.toString() === id.toString()),
          );
        } else {
          query.productId = {
            $in: productIds.filter(
              (pid) => pid.toString() === query.productId.toString(),
            ),
          };
        }
      } else {
        query.productId = { $in: productIds };
      }
    } else if (sellerId) {
      // Legacy sellerId filter (if no other product filters)
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      const productIds = sellerProducts.map((p) => p._id);
      query.productId = { $in: productIds };
    }

    // Build quantity filter combining status and quantity range
    const quantityFilter: any = {};

    // Apply status filter
    if (status === 'in_stock') {
      quantityFilter.$gt = 0;
    } else if (status === 'out_of_stock') {
      quantityFilter.$lte = 0;
    }

    // Apply quantity range filters
    if (minQuantity !== undefined) {
      if (quantityFilter.$gt !== undefined) {
        // If status is in_stock, ensure minQuantity is at least 1
        quantityFilter.$gte = Math.max(minQuantity, 1);
        delete quantityFilter.$gt;
      } else if (quantityFilter.$lte !== undefined) {
        // If status is out_of_stock, minQuantity should be <= 0
        quantityFilter.$gte = Math.min(minQuantity, 0);
      } else {
        quantityFilter.$gte = minQuantity;
      }
    }

    if (maxQuantity !== undefined) {
      if (quantityFilter.$lte !== undefined) {
        // If status is out_of_stock, ensure maxQuantity is at most 0
        quantityFilter.$lte = Math.min(maxQuantity, 0);
      } else {
        quantityFilter.$lte = maxQuantity;
      }
    }

    // Apply quantity filter if any conditions were set
    if (Object.keys(quantityFilter).length > 0) {
      query.totalQuantity = quantityFilter;
    }

    const [data, total] = await Promise.all([
      this.inventoryModel
        .find(query)
        .populate('productId', 'nameEn nameAr sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.inventoryModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllWithFilters(
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      productId?: string;
      productIds?: string[];
      status?: string;
      minQuantity?: number;
      maxQuantity?: number;
      active?: boolean;
      storeId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    sellerId?: string,
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const query: any = {};

    // Product ID filter (single or multiple)
    if (filters.productIds && filters.productIds.length > 0) {
      query.productId = { $in: filters.productIds };
    } else if (filters.productId) {
      query.productId = filters.productId;
    }

    // Store ID filter (from URL parameter)
    if (filters.storeId) {
      const storeProducts = await this.productModel
        .find({ store: filters.storeId })
        .select('_id');
      const productIds = storeProducts.map((p) => p._id);
      if (query.productId) {
        // Combine with existing productId filter
        if (query.productId.$in) {
          query.productId.$in = query.productId.$in.filter((id: any) =>
            productIds.some((pid) => pid.toString() === id.toString()),
          );
        } else {
          query.productId = {
            $in: productIds.filter(
              (pid) => pid.toString() === query.productId.toString(),
            ),
          };
        }
      } else {
        query.productId = { $in: productIds };
      }
    }

    // Seller ID filter
    if (sellerId) {
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      const productIds = sellerProducts.map((p) => p._id);
      if (query.productId) {
        if (query.productId.$in) {
          query.productId.$in = query.productId.$in.filter((id: any) =>
            productIds.some((pid) => pid.toString() === id.toString()),
          );
        } else {
          query.productId = {
            $in: productIds.filter(
              (pid) => pid.toString() === query.productId.toString(),
            ),
          };
        }
      } else {
        query.productId = { $in: productIds };
      }
    }

    // Search filter
    if (filters.search) {
      const products = await this.productModel
        .find({
          $or: [
            { nameEn: { $regex: filters.search, $options: 'i' } },
            { nameAr: { $regex: filters.search, $options: 'i' } },
          ],
        })
        .select('_id');
      const productIds = products.map((p) => p._id);
      if (query.productId) {
        if (query.productId.$in) {
          query.productId.$in = query.productId.$in.filter((id: any) =>
            productIds.some((pid) => pid.toString() === id.toString()),
          );
        } else {
          query.productId = {
            $in: productIds.filter(
              (pid) => pid.toString() === query.productId.toString(),
            ),
          };
        }
      } else {
        query.productId = { $in: productIds };
      }
    }

    // Active filter
    if (filters.active !== undefined) {
      query.active = filters.active;
    }

    // Build quantity filter combining status and quantity range
    const quantityFilter: any = {};

    // Apply status filter
    if (filters.status === 'in_stock') {
      quantityFilter.$gt = 0;
    } else if (filters.status === 'out_of_stock') {
      quantityFilter.$lte = 0;
    }

    // Apply quantity range filters
    if (filters.minQuantity !== undefined) {
      if (quantityFilter.$gt !== undefined) {
        quantityFilter.$gte = Math.max(filters.minQuantity, 1);
        delete quantityFilter.$gt;
      } else if (quantityFilter.$lte !== undefined) {
        quantityFilter.$gte = Math.min(filters.minQuantity, 0);
      } else {
        quantityFilter.$gte = filters.minQuantity;
      }
    }

    if (filters.maxQuantity !== undefined) {
      if (quantityFilter.$lte !== undefined) {
        quantityFilter.$lte = Math.min(filters.maxQuantity, 0);
      } else {
        quantityFilter.$lte = filters.maxQuantity;
      }
    }

    // Apply quantity filter if any conditions were set
    if (Object.keys(quantityFilter).length > 0) {
      query.totalQuantity = quantityFilter;
    }

    // Build sort object
    const sort: any = {};
    if (filters.sortBy) {
      sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    const [data, total] = await Promise.all([
      this.inventoryModel
        .find(query)
        .populate('productId', 'nameEn nameAr sku')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.inventoryModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, sellerId?: string): Promise<ProductInventory> {
    const inventory = await this.inventoryModel.findById(id);

    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    if (sellerId) {
      const product = await this.productModel.findById(inventory.productId);
      if (!product || product.sellerId?.toString() !== sellerId) {
        throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
      }
    }

    // Populate productId after validation
    await inventory.populate(
      'productId',
      'nameEn nameAr sku sizes colors stockQuantity',
    );

    return inventory;
  }

  async findByProductId(
    productId: string,
    sellerId?: string,
  ): Promise<ProductInventory> {
    const inventory = await this.inventoryModel.findOne({ productId });

    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    if (sellerId) {
      const product = await this.productModel.findById(productId);
      if (!product || product.sellerId?.toString() !== sellerId) {
        throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
      }
    }

    // Populate productId after validation
    await inventory.populate(
      'productId',
      'nameEn nameAr sku sizes colors stockQuantity',
    );

    return inventory;
  }

  async update(
    id: string,
    dto: UpdateInventoryDto,
    sellerId?: string,
  ): Promise<ProductInventory> {
    const inventory = await this.inventoryModel.findById(id);
    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    if (sellerId) {
      const product = await this.productModel.findById(inventory.productId);
      if (!product || product.sellerId?.toString() !== sellerId) {
        throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
      }
    }

    // If updating productId, check if new product exists
    const product = await this.productModel.findById(
      dto.productId || inventory.productId,
    );
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    // If updating variants, validate them
    if (dto.variants) {
      this.validateVariants(dto.variants, product);

      // Calculate total quantity
      const totalQuantity = dto.variants.reduce(
        (sum, variant) => sum + variant.quantity,
        0,
      );

      // Check if total quantity exceeds product stock
      if (totalQuantity > product.stockQuantity) {
        throw new BadRequestException('INVENTORY_EXCEEDS_PRODUCT_STOCK');
      }

      // Check for duplicate variant combinations
      const variantKeys = dto.variants.map(
        (v) => `${v.size}:${v.colors.sort().join(',')}`,
      );
      const uniqueKeys = new Set(variantKeys);
      if (variantKeys.length !== uniqueKeys.size) {
        throw new BadRequestException('DUPLICATE_VARIANT_COMBINATIONS');
      }

      // Update totalQuantity on inventory object
      inventory.totalQuantity = totalQuantity;
    }

    Object.assign(inventory, dto);
    return inventory.save();
  }

  async updateStatus(
    id: string,
    dto: UpdateInventoryStatusDto,
    sellerId?: string,
  ): Promise<ProductInventory> {
    const inventory = await this.inventoryModel.findById(id);
    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    if (sellerId) {
      const product = await this.productModel.findById(inventory.productId);
      if (!product || product.sellerId?.toString() !== sellerId) {
        throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
      }
    }

    inventory.active = dto.active;
    return inventory.save();
  }

  async remove(id: string, sellerId?: string): Promise<void> {
    const inventory = await this.inventoryModel.findById(id);
    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    if (sellerId) {
      const product = await this.productModel.findById(inventory.productId);
      if (!product || product.sellerId?.toString() !== sellerId) {
        throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
      }
    }

    // Delete the inventory document
    // Note: All nested variants are automatically deleted when the inventory document is deleted
    // MongoDB/Mongoose automatically removes all subdocuments (variants array) when the parent document is deleted
    await this.inventoryModel.findByIdAndDelete(id);
  }

  async bulkRemove(
    ids: string[],
    sellerId?: string,
  ): Promise<{
    deletedCount: number;
    failedIds: string[];
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('INVENTORY_IDS_REQUIRED');
    }

    const failedIds: string[] = [];
    let deletedCount = 0;

    // If seller, get all their product IDs first
    let sellerProductIds: string[] = [];
    if (sellerId) {
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      sellerProductIds = sellerProducts.map((p) => p._id.toString());
    }

    // Process each inventory deletion
    for (const id of ids) {
      try {
        const inventory = await this.inventoryModel.findById(id);

        if (!inventory) {
          failedIds.push(id);
          continue;
        }

        // Check if seller owns the product
        if (sellerId) {
          const productId = inventory.productId.toString();
          if (!sellerProductIds.includes(productId)) {
            failedIds.push(id);
            continue;
          }
        }

        // Explicitly clear variants before deletion
        // This ensures all variant data (including images, attributes, etc.) is removed
        // Note: Variants are also automatically deleted when the inventory document is deleted,
        // but explicit clearing ensures proper cleanup and makes the intent clear
        if (inventory.variants && inventory.variants.length > 0) {
          inventory.variants = [];
          await inventory.save();
        }

        // Delete the inventory document
        // All nested variants are automatically deleted when the inventory document is deleted
        // MongoDB/Mongoose automatically removes all subdocuments (variants array) when the parent document is deleted
        await this.inventoryModel.findByIdAndDelete(id);
        deletedCount++;
      } catch (error) {
        failedIds.push(id);
      }
    }

    return {
      deletedCount,
      failedIds,
    };
  }

  async updateVariant(
    inventoryId: string,
    variantId: string,
    variantData: {
      size?: string;
      colors?: string[];
      quantity?: number;
      image?: string;
      attributes?: Record<string, any>;
    },
    sellerId?: string,
  ): Promise<ProductInventory> {
    const inventory = await this.inventoryModel.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    if (sellerId) {
      const product = await this.productModel.findById(inventory.productId);
      if (!product || product.sellerId?.toString() !== sellerId) {
        throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
      }
    }

    // Get product for validation
    const product = await this.productModel.findById(inventory.productId);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    // Find variant by _id or by index (for backward compatibility)
    let variantIndex = -1;
    let variantIdObj: Types.ObjectId | null = null;

    // Try to parse as ObjectId
    if (Types.ObjectId.isValid(variantId)) {
      try {
        variantIdObj = new Types.ObjectId(variantId);
      } catch (e) {
        // Invalid ObjectId format, will try as index
      }
    }

    // Try to find by ObjectId first
    if (variantIdObj) {
      variantIndex = inventory.variants.findIndex(
        (v: any) => v._id && v._id.toString() === variantIdObj.toString(),
      );
    }

    // If not found by ObjectId, try as array index (for backward compatibility)
    if (variantIndex === -1) {
      const index = parseInt(variantId);
      if (!isNaN(index) && index >= 0 && index < inventory.variants.length) {
        variantIndex = index;
      }
    }

    // Validate variant found
    if (variantIndex === -1 || variantIndex >= inventory.variants.length) {
      throw new BadRequestException('VARIANT_NOT_FOUND');
    }

    // Get the variant to update
    const variant = inventory.variants[variantIndex];
    const updatedVariant = {
      size: variantData.size ?? variant.size,
      colors: variantData.colors ?? variant.colors,
      quantity: variantData.quantity ?? variant.quantity,
      image:
        variantData.image !== undefined ? variantData.image : variant.image,
      attributes: variantData.attributes ?? variant.attributes,
    };

    // Validate the updated variant
    this.validateVariants([updatedVariant], product);

    // Check for duplicate variant combinations (excluding current variant)
    const otherVariants = inventory.variants.filter(
      (_, index) => index !== variantIndex,
    );
    const allVariants = [...otherVariants, updatedVariant];
    const variantKeys = allVariants.map(
      (v) => `${v.size}:${v.colors.sort().join(',')}`,
    );
    const uniqueKeys = new Set(variantKeys);
    if (variantKeys.length !== uniqueKeys.size) {
      throw new BadRequestException('DUPLICATE_VARIANT_COMBINATIONS');
    }

    // Update the variant
    inventory.variants[variantIndex] = updatedVariant as any;

    // Recalculate total quantity
    const totalQuantity = inventory.variants.reduce(
      (sum, v) => sum + v.quantity,
      0,
    );

    // Check if total quantity exceeds product stock
    if (totalQuantity > product.stockQuantity) {
      throw new BadRequestException('INVENTORY_EXCEEDS_PRODUCT_STOCK');
    }

    inventory.totalQuantity = totalQuantity;
    return inventory.save();
  }

  private validateVariants(
    variants: { size: string; colors: string[]; quantity: number }[],
    product: ProductDocument,
  ): void {
    for (const variant of variants) {
      // Validate size exists in product
      if (!product.sizes.includes(variant.size)) {
        throw new BadRequestException(
          `INVALID_SIZE: ${variant.size} is not available for this product`,
        );
      }

      // Validate all colors exist in product
      for (const color of variant.colors) {
        if (!product.colors.includes(color)) {
          throw new BadRequestException(
            `INVALID_COLOR: ${color} is not available for this product`,
          );
        }
      }
    }
  }
}
