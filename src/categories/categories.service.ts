import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { SubCategory, SubCategoryDocument } from '../sub-categories/entities/subcategory.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.categoryModel.findOne({ slug: dto.slug }).exec();
    if (exists) throw new BadRequestException('CATEGORY_SLUG_ALREADY_EXISTS');

    const existsAr = await this.categoryModel.findOne({ slugAr: dto.slugAr }).exec();
    if (existsAr) throw new BadRequestException('CATEGORY_SLUG_AR_ALREADY_EXISTS');

    const category = new this.categoryModel(dto);
    return category.save();
  }

async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: any[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    // Build search filter
    const filter: any = {};
    if (query.search) {
      const regex = new RegExp(query.search, 'i'); // case-insensitive
      filter.$or = [{ name: regex }, { nameAr: regex }];
    }

    // Total count
    const total = await this.categoryModel.countDocuments(filter);

    // Fetch categories with minimal fields
    const categories = await this.categoryModel
      .find(filter, 'name nameAr image active')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Map categories to add dummy fields
    const data = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      nameAr: cat.nameAr,
      image: cat.image,
      status: cat.active, // rename active -> status
      products: 0,
      totalOrders: 0,
      totalSales: 0,
    }));

    return { data, total };
  }


  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException('CATEGORY_NOT_FOUND');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('CATEGORY_NOT_FOUND');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    // Check if category exists
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('CATEGORY_NOT_FOUND');
    }

    // Check if category has subcategories
    const subCategoriesCount = await this.subCategoryModel.countDocuments({
      parentCategory: new Types.ObjectId(id),
    });

    if (subCategoriesCount > 0) {
      throw new BadRequestException('CATEGORY_HAS_SUBCATEGORIES');
    }

    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  async updateStatus(id: string, dto: { active: boolean }) {
  const updated = await this.categoryModel.findByIdAndUpdate(
    id,
    { active: dto.active },
    { new: true }
  );

  if (!updated) throw new NotFoundException('CATEGORY_NOT_FOUND');

  return updated;
}


}
