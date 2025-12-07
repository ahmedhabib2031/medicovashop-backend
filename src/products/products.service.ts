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

  async create(dto: CreateProductDto, sellerId?: string): Promise<Product> {
    // Check if permalink already exists
    const existingPermalink = await this.productModel.findOne({
      permalink: dto.permalink,
    });
    if (existingPermalink) {
      throw new BadRequestException('PRODUCT_PERMALINK_EXISTS');
    }

    // Auto-generate SKU if not provided
    let sku = dto.sku;
    if (!sku) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      sku = `PROD-${timestamp}-${random}`;
    }

    // Check if SKU already exists
    const existingSku = await this.productModel.findOne({ sku });
    if (existingSku) {
      throw new BadRequestException('PRODUCT_SKU_EXISTS');
    }

    const productData: any = {
      ...dto,
      sku,
      category: dto.category,
      subcategory: dto.subcategory,
      brand: dto.brand,
      store: dto.store,
      relatedProducts: dto.relatedProducts || [],
    };

    // Convert date strings to Date objects
    if (dto.saleStartDate) {
      productData.saleStartDate = new Date(dto.saleStartDate);
    }
    if (dto.saleEndDate) {
      productData.saleEndDate = new Date(dto.saleEndDate);
    }

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
      filter.price = {};
      if (query.minPrice !== undefined) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.price.$lte = query.maxPrice;
      }
    }

    // Search filter
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { productName: regex },
        { productNameAr: regex },
        { productTitle: regex },
        { productTitleAr: regex },
        { sku: regex },
        { permalink: regex },
        { productDescription: regex },
        { productDescriptionAr: regex },
      ];
    }

    const total = await this.productModel.countDocuments(filter);

    const products = await this.productModel
      .find(filter)
      .populate('category', 'name nameAr')
      .populate('subcategory', 'name nameAr')
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address')
      .populate('sellerId', 'fullName email')
      .populate('relatedProducts', 'productName productNameAr price')
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
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address storePhone storeEmail')
      .populate('sellerId', 'fullName email')
      .populate('relatedProducts', 'productName productNameAr price productImages')
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

    // Check if SKU is being updated and if it already exists
    if (dto.sku) {
      const existingProduct = await this.productModel.findOne({
        sku: dto.sku,
        _id: { $ne: id },
      });
      if (existingProduct) {
        throw new BadRequestException('PRODUCT_SKU_EXISTS');
      }
    }

    const updateData: any = { ...dto };

    // Convert date strings to Date objects
    if (dto.saleStartDate) {
      updateData.saleStartDate = new Date(dto.saleStartDate);
    }
    if (dto.saleEndDate) {
      updateData.saleEndDate = new Date(dto.saleEndDate);
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name nameAr')
      .populate('subcategory', 'name nameAr')
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address')
      .populate('sellerId', 'fullName email')
      .populate('relatedProducts', 'productName productNameAr price productImages')
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
      .populate('brand', 'name nameAr logo')
      .populate('store', 'name address')
      .populate('sellerId', 'fullName email')
      .populate('relatedProducts', 'productName productNameAr price productImages')
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
