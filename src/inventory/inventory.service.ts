import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductInventory,
  ProductInventoryDocument,
} from './entities/product-inventory.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateInventoryStatusDto } from './dto/update-inventory-status.dto';
import { UpdateInventoryVariantDto } from './dto/update-inventory-variant.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(ProductInventory.name)
    private inventoryModel: Model<ProductInventoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (productId) {
      query.productId = productId;
    }

    if (sellerId) {
      // Find products owned by seller, then filter inventory
      const sellerProducts = await this.productModel
        .find({ sellerId })
        .select('_id');
      const productIds = sellerProducts.map((p) => p._id);
      query.productId = { $in: productIds };
    }

    if (search) {
      // Search in product name via populate
      const products = await this.productModel
        .find({
          $or: [
            { productName: { $regex: search, $options: 'i' } },
            { productNameAr: { $regex: search, $options: 'i' } },
          ],
        })
        .select('_id');
      const productIds = products.map((p) => p._id);
      query.productId = { $in: productIds };
    }

    const [data, total] = await Promise.all([
      this.inventoryModel
        .find(query)
        .populate(
          'productId',
          'nameEn nameAr sku featuredImages galleryImages',
        )
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
      'nameEn nameAr sku sizes colors stockQuantity featuredImages galleryImages',
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
      'nameEn nameAr sku sizes colors stockQuantity featuredImages galleryImages',
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
    let product = await this.productModel.findById(
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

  async updateVariant(
    inventoryId: string,
    dto: UpdateInventoryVariantDto,
    sellerId?: string,
  ): Promise<ProductInventory> {
    const inventory = await this.inventoryModel.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundException('INVENTORY_NOT_FOUND');
    }

    // Check if seller owns the product
    const product = await this.productModel.findById(inventory.productId);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    if (sellerId && product.sellerId?.toString() !== sellerId) {
      throw new BadRequestException('INVENTORY_NOT_OWNED_BY_SELLER');
    }

    const targetColors = [...dto.colors].sort().join(',');
    const variant = inventory.variants.find(
      (v) => v.size === dto.size && [...v.colors].sort().join(',') === targetColors,
    );

    if (!variant) {
      throw new NotFoundException('VARIANT_NOT_FOUND');
    }

    // Validate variant still matches product constraints
    this.validateVariants(
      [
        {
          size: dto.size,
          colors: dto.colors,
          quantity: dto.quantity ?? variant.quantity,
        },
      ],
      product,
    );

    // Update fields
    if (dto.quantity !== undefined) {
      variant.quantity = dto.quantity;
    }
    if (dto.image !== undefined) {
      variant.image = dto.image || null;
    }
    if (dto.attributes !== undefined) {
      variant.attributes = dto.attributes;
    }

    // Recalculate total quantity
    inventory.totalQuantity = inventory.variants.reduce(
      (sum, v) => sum + (v.quantity || 0),
      0,
    );

    // Ensure inventory does not exceed product stock
    if (inventory.totalQuantity > product.stockQuantity) {
      throw new BadRequestException('INVENTORY_EXCEEDS_PRODUCT_STOCK');
    }

    const saved = await inventory.save();
    await saved.populate(
      'productId',
      'nameEn nameAr sku sizes colors stockQuantity featuredImages galleryImages',
    );
    return saved;
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

    await this.inventoryModel.findByIdAndDelete(id);
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

