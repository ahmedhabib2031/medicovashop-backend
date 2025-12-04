import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubcategoryChild, SubcategoryChildDocument } from './entities/subcategory-child.entity';
import { CreateSubcategoryChildDto, UpdateSubcategoryChildDto } from './dto/subcategory-child.dto';

@Injectable()
export class SubcategoryChildService {
  constructor(
    @InjectModel(SubcategoryChild.name)
    private subcategoryChildModel: Model<SubcategoryChildDocument>,
  ) {}

  async create(dto: CreateSubcategoryChildDto): Promise<SubcategoryChild> {
    const exists = await this.subcategoryChildModel.findOne({ slug: dto.slug });
    if (exists) throw new BadRequestException('SUBCATEGORY_CHILD_SLUG_ALREADY_EXISTS');

    return this.subcategoryChildModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    parentSubCategory?: string;
  }): Promise<{ data: any[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ name: regex }, { nameAr: regex }];
    }

    if (query.parentSubCategory) {
      filter.parentSubCategory = new Types.ObjectId(query.parentSubCategory);
    }

    const total = await this.subcategoryChildModel.countDocuments(filter);

    const children = await this.subcategoryChildModel
      .find(filter, 'name nameAr image active parentSubCategory')
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'parentSubCategory',
        select: 'name nameAr',
      })
      .lean()
      .exec();

    const data = children.map((ch) => ({
      _id: ch._id,
      name: ch.name,
      nameAr: ch.nameAr,
      image: ch.image,
      status: ch.active,
      parentSubCategory: ch.parentSubCategory,
      products: 0,
      totalOrders: 0,
      totalSales: 0,
    }));

    return { data, total };
  }

  async findOne(id: string): Promise<SubcategoryChild> {
    const child = await this.subcategoryChildModel.findById(id).lean();
    if (!child) throw new NotFoundException('SUBCATEGORY_CHILD_NOT_FOUND');
    return child as any;
  }

  async update(id: string, dto: UpdateSubcategoryChildDto): Promise<SubcategoryChild> {
    const updated = await this.subcategoryChildModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('SUBCATEGORY_CHILD_NOT_FOUND');
    return updated;
  }

  async updateStatus(id: string, dto: { active: boolean }): Promise<SubcategoryChild> {
    const updated = await this.subcategoryChildModel.findByIdAndUpdate(
      id,
      { active: dto.active },
      { new: true },
    );

    if (!updated) throw new NotFoundException('SUBCATEGORY_CHILD_NOT_FOUND');

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.subcategoryChildModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('SUBCATEGORY_CHILD_NOT_FOUND');
  }
}


