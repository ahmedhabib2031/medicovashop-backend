import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubCategory, SubCategoryDocument } from './entities/subcategory.entity';
import { CreateSubCategoryDto, UpdateSubCategoryDto } from './dto/subcategory.dto';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
  ) {}

  async create(dto: CreateSubCategoryDto): Promise<SubCategory> {
    // Check duplicate slug
    const exists = await this.subCategoryModel.findOne({ slug: dto.slug });
    if (exists) throw new BadRequestException('SUBCATEGORY_SLUG_ALREADY_EXISTS');

    return this.subCategoryModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    parentCategory?: string;
  }): Promise<{ data: any[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { nameAr: regex }];
    }

    if (query.parentCategory) {
      filter.parentCategory = new Types.ObjectId(query.parentCategory);
    }

    const total = await this.subCategoryModel.countDocuments(filter);

const subCategories = await this.subCategoryModel
  .find(filter, 'name nameAr image active parentCategory') // select fields
  .skip(skip)
  .limit(limit)
  .populate({
    path: 'parentCategory',
    select: 'name nameAr', // only include parent name fields
  })
  .lean()
  .exec();

    const data = subCategories.map(sc => ({
      _id: sc._id,
      name: sc.name,
      nameAr: sc.nameAr,
      image: sc.image,
      status: sc.active,
      parentCategory: sc.parentCategory,
      products: 0,
      totalOrders: 0,
      totalSales: 0,
    }));

    return { data, total };
  }

  async findOne(id: string): Promise<SubCategory> {
    const sub = await this.subCategoryModel.findById(id).lean();
    if (!sub) throw new NotFoundException('SUBCATEGORY_NOT_FOUND');
    return sub as any;
  }

  async update(id: string, dto: UpdateSubCategoryDto): Promise<SubCategory> {
    const updated = await this.subCategoryModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('SUBCATEGORY_NOT_FOUND');
    return updated;
  }

  async updateStatus(id: string, dto: { active: boolean }): Promise<SubCategory> {
    const updated = await this.subCategoryModel.findByIdAndUpdate(
      id,
      { active: dto.active },
      { new: true },
    );

    if (!updated) throw new NotFoundException('SUBCATEGORY_NOT_FOUND');

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.subCategoryModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('SUBCATEGORY_NOT_FOUND');
  }
}
