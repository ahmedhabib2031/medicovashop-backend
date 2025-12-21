import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto, sellerId?: string, adminId?: string): Promise<Product> {
    // Check if permalink already exists
    const existingPermalink = await this.productModel.findOne({
      permalink: dto.permalink,
    });
    if (existingPermalink) {
      throw new BadRequestException('PRODUCT_PERMALINK_EXISTS');
    }

    // Handle SKU based on identity
    let sku = dto.identity?.sku;
    const skuMode = dto.identity?.skuMode || 'auto-generated';

    // Auto-generate SKU if not provided or if mode is auto-generated
    if (!sku || skuMode === 'auto-generated') {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      sku = `PSKU_${random}_${timestamp}`;
    }

    // Check if SKU already exists
    const existingSku = await this.productModel.findOne({ sku });
    if (existingSku) {
      throw new BadRequestException('PRODUCT_SKU_EXISTS');
    }

    // Build product data from nested DTO structure
    const productData: any = {
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      permalink: dto.permalink,
      sku,
      skuMode,
      category: dto.classification.category,
      subcategory: dto.classification.subcategory,
      childCategory: dto.classification.childCategory || null,
      brand: dto.classification.brand,
      productType: dto.classification.productType || 'Physical Product',
      store: dto.store,
      descriptionEn: dto.descriptions.descriptionEn,
      descriptionAr: dto.descriptions.descriptionAr,
      createdBy: dto.createdBy || (sellerId ? 'seller' : 'admin'),
      createdById: sellerId || adminId || null,
      keyFeatures: dto.keyFeatures || [],
      featuredImages: dto.media?.featuredImages || [],
      galleryImages: dto.media?.galleryImages || [],
      productVideo: dto.media?.productVideo || null,
      originalPrice: dto.pricing.originalPrice,
      salePrice: dto.pricing.salePrice || null,
      discount: dto.pricing.discount
        ? {
            type: dto.pricing.discount.type || 'percent',
            value: dto.pricing.discount.value || 0,
            amount: dto.pricing.discount.amount || 0,
            startDate: dto.pricing.discount.startDate
              ? new Date(dto.pricing.discount.startDate)
              : null,
            endDate: dto.pricing.discount.endDate
              ? new Date(dto.pricing.discount.endDate)
              : null,
          }
        : null,
      trackStock: dto.inventory?.trackStock !== undefined ? dto.inventory.trackStock : true,
      stockQuantity: dto.inventory?.stockQuantity || 0,
      stockStatus: dto.inventory?.stockStatus || 'in_stock',
      inventoryProductType: dto.inventory?.productType || 'simple',
      skuGenerated: dto.inventory?.skuGenerated || sku,
      sizes: dto.variants?.sizes || [],
      colors: dto.variants?.colors || [],
      options: dto.variants?.options || [],
      shipping: dto.shipping || null,
      specifications: dto.specifications || [],
      relatedProducts: dto.relations?.relatedProducts || [],
      crossSellingProducts: dto.relations?.crossSellingProducts
        ? dto.relations.crossSellingProducts.map((item) => ({
            productId: item.productId,
            price: item.price,
            type: item.type,
          }))
        : [],
      active: true,
    };

    // Add sellerId if provided
    if (sellerId) {
      productData.sellerId = sellerId;
    }

    return await this.productModel.create(productData);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    sellerId?: string;
    active?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ data: Product[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.category) {
      filter.category = query.category;
    }

    if (query.subcategory) {
      filter.subcategory = query.subcategory;
    }

    if (query.brand) {
      filter.brand = query.brand;
    }

    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    if (query.active !== undefined) {
      filter.active = query.active;
    }

    // Price range filter
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.originalPrice = {};
      if (query.minPrice !== undefined) {
        filter.originalPrice.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.originalPrice.$lte = query.maxPrice;
      }
    }

    // Search filter
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { nameEn: regex },
        { nameAr: regex },
        { sku: regex },
        { permalink: regex },
        { descriptionEn: regex },
        { descriptionAr: regex },
      ];
    }

    const total = await this.productModel.countDocuments(filter);

    const products = await this.productModel
      .find(filter)
      .populate('category', 'name nameAr')
      .populate('subcategory', 'name nameAr')
      .populate('childCategory', 'name nameAr')
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address')
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('relatedProducts', 'nameEn nameAr originalPrice')
      .populate('crossSellingProducts.productId', 'nameEn nameAr originalPrice')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return { data: products as Product[], total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name nameAr')
      .populate('subcategory', 'name nameAr')
      .populate('childCategory', 'name nameAr')
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address storePhone storeEmail')
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('relatedProducts', 'nameEn nameAr originalPrice featuredImages')
      .populate('crossSellingProducts.productId', 'nameEn nameAr originalPrice featuredImages')
      .lean();

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    return product as Product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    // Check if permalink is being updated and if it already exists
    if (dto.permalink) {
      const existingProduct = await this.productModel.findOne({
        permalink: dto.permalink,
        _id: { $ne: id },
      });
      if (existingProduct) {
        throw new BadRequestException('PRODUCT_PERMALINK_EXISTS');
      }
    }

    // Check if SKU is being updated (from identity)
    if (dto.identity?.sku) {
      const existingProduct = await this.productModel.findOne({
        sku: dto.identity.sku,
        _id: { $ne: id },
      });
      if (existingProduct) {
        throw new BadRequestException('PRODUCT_SKU_EXISTS');
      }
    }

    // Build update data from nested structure
    const updateData: any = {};

    // Basic fields
    if (dto.nameEn !== undefined) updateData.nameEn = dto.nameEn;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.permalink !== undefined) updateData.permalink = dto.permalink;

    // Identity
    if (dto.identity) {
      if (dto.identity.sku !== undefined) updateData.sku = dto.identity.sku;
      if (dto.identity.skuMode !== undefined) updateData.skuMode = dto.identity.skuMode;
    }

    // Classification
    if (dto.classification) {
      if (dto.classification.category !== undefined) updateData.category = dto.classification.category;
      if (dto.classification.subcategory !== undefined) updateData.subcategory = dto.classification.subcategory;
      if (dto.classification.childCategory !== undefined) updateData.childCategory = dto.classification.childCategory || null;
      if (dto.classification.brand !== undefined) updateData.brand = dto.classification.brand;
      if (dto.classification.productType !== undefined) updateData.productType = dto.classification.productType;
    }

    // Descriptions
    if (dto.descriptions) {
      if (dto.descriptions.descriptionEn !== undefined) updateData.descriptionEn = dto.descriptions.descriptionEn;
      if (dto.descriptions.descriptionAr !== undefined) updateData.descriptionAr = dto.descriptions.descriptionAr;
    }

    // Created By
    if (dto.createdBy !== undefined) updateData.createdBy = dto.createdBy;

    // Key Features
    if (dto.keyFeatures !== undefined) updateData.keyFeatures = dto.keyFeatures;

    // Media
    if (dto.media) {
      if (dto.media.featuredImages !== undefined) updateData.featuredImages = dto.media.featuredImages;
      if (dto.media.galleryImages !== undefined) updateData.galleryImages = dto.media.galleryImages;
      if (dto.media.productVideo !== undefined) updateData.productVideo = dto.media.productVideo || null;
    }

    // Pricing
    if (dto.pricing) {
      if (dto.pricing.originalPrice !== undefined) updateData.originalPrice = dto.pricing.originalPrice;
      if (dto.pricing.salePrice !== undefined) updateData.salePrice = dto.pricing.salePrice || null;
      if (dto.pricing.discount !== undefined) {
        updateData.discount = dto.pricing.discount
          ? {
              type: dto.pricing.discount.type || 'percent',
              value: dto.pricing.discount.value || 0,
              amount: dto.pricing.discount.amount || 0,
              startDate: dto.pricing.discount.startDate
                ? new Date(dto.pricing.discount.startDate)
                : null,
              endDate: dto.pricing.discount.endDate
                ? new Date(dto.pricing.discount.endDate)
                : null,
            }
          : null;
      }
    }

    // Inventory
    if (dto.inventory) {
      if (dto.inventory.trackStock !== undefined) updateData.trackStock = dto.inventory.trackStock;
      if (dto.inventory.stockQuantity !== undefined) updateData.stockQuantity = dto.inventory.stockQuantity;
      if (dto.inventory.stockStatus !== undefined) updateData.stockStatus = dto.inventory.stockStatus;
      if (dto.inventory.productType !== undefined) updateData.inventoryProductType = dto.inventory.productType;
      if (dto.inventory.skuGenerated !== undefined) updateData.skuGenerated = dto.inventory.skuGenerated;
    }

    // Variants
    if (dto.variants) {
      if (dto.variants.sizes !== undefined) updateData.sizes = dto.variants.sizes;
      if (dto.variants.colors !== undefined) updateData.colors = dto.variants.colors;
      if (dto.variants.options !== undefined) updateData.options = dto.variants.options;
    }

    // Shipping
    if (dto.shipping !== undefined) updateData.shipping = dto.shipping;

    // Specifications
    if (dto.specifications !== undefined) updateData.specifications = dto.specifications;

    // Relations
    if (dto.relations) {
      if (dto.relations.relatedProducts !== undefined) updateData.relatedProducts = dto.relations.relatedProducts;
      if (dto.relations.crossSellingProducts !== undefined) {
        updateData.crossSellingProducts = dto.relations.crossSellingProducts.map((item) => ({
          productId: item.productId,
          price: item.price,
          type: item.type,
        }));
      }
    }

    // Store
    if (dto.store !== undefined) updateData.store = dto.store;

    const product = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name nameAr')
      .populate('subcategory', 'name nameAr')
      .populate('childCategory', 'name nameAr')
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address')
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('relatedProducts', 'nameEn nameAr originalPrice featuredImages')
      .populate('crossSellingProducts.productId', 'nameEn nameAr originalPrice featuredImages')
      .lean();

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    return product as Product;
  }

  async updateStatus(
    id: string,
    dto: UpdateProductStatusDto,
  ): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { active: dto.active }, { new: true })
      .populate('category', 'name nameAr')
      .populate('subcategory', 'name nameAr')
      .populate('childCategory', 'name nameAr')
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address')
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('relatedProducts', 'nameEn nameAr originalPrice featuredImages')
      .populate('crossSellingProducts.productId', 'nameEn nameAr originalPrice featuredImages')
      .lean();

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    return product as Product;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    return { deleted: true };
  }
}
