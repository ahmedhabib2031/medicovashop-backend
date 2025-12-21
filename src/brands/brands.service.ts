import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from './entities/brand.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandStatusDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateBrandDto): Promise<Brand> {
    const exists = await this.brandModel.findOne({ slug: dto.slug });
    if (exists) throw new BadRequestException('BRAND_SLUG_EXISTS');

    const existsAr = await this.brandModel.findOne({ slugAr: dto.slugAr });
    if (existsAr) throw new BadRequestException('BRAND_SLUG_AR_EXISTS');

    return await this.brandModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: any[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { nameAr: regex }];
    }

    const total = await this.brandModel.countDocuments(filter);

    const brands = await this.brandModel
      .find(filter, 'name nameAr logo active priority sortOrder')
      .skip(skip)
      .limit(limit)
      .sort({ sortOrder: 1, priority: 1, createdAt: -1 })
      .lean();

    // Count products for each brand
    // Use Promise.all to count products for all brands in parallel
    const productCountPromises = brands.map(async (brand: any) => {
      const brandId =
        brand._id instanceof Types.ObjectId
          ? brand._id
          : new Types.ObjectId(brand._id);
      const brandIdStr = brand._id.toString();

      // Count products with this brand ID
      // Try matching both ObjectId and string formats
      const count = await this.productModel.countDocuments({
        $or: [{ brand: brandId }, { brand: brandIdStr }, { brand: brand._id }],
      });

      return {
        brandId: brandIdStr,
        count,
      };
    });

    const productCountResults = await Promise.all(productCountPromises);

    // Create a map for quick lookup
    const productCountMap = new Map<string, number>();
    productCountResults.forEach((result) => {
      productCountMap.set(result.brandId, result.count);
    });

    const data = brands.map((brand: any) => {
      const brandKey = brand._id.toString();

      return {
        _id: brand._id,
        name: brand.name,
        nameAr: brand.nameAr,
        logo: brand.logo,
        priority: brand.priority,
        status: brand.active,
        products: productCountMap.get(brandKey) || 0,
        totalOrders: 0,
        totalSales: 0,
      };
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandModel.findById(id);
    if (!brand) throw new NotFoundException('BRAND_NOT_FOUND');
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brandModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!brand) throw new NotFoundException('BRAND_NOT_FOUND');
    return brand;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const brand = await this.brandModel.findByIdAndDelete(id);
    if (!brand) throw new NotFoundException('BRAND_NOT_FOUND');
    return { deleted: true };
  }

  async updateStatus(id: string, dto: UpdateBrandStatusDto) {
    const brand = await this.brandModel.findByIdAndUpdate(
      id,
      { active: dto.active },
      { new: true },
    );

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }
}
