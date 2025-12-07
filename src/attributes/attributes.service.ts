import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProductAttribute,
  ProductAttributeDocument,
} from './entities/attribute.entity';
import { CreateProductAttributeDto } from './dto/create-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(
    @InjectModel(ProductAttribute.name)
    private attributeModel: Model<ProductAttributeDocument>,
  ) {}

  async create(dto: CreateProductAttributeDto): Promise<ProductAttribute> {
    const created = new this.attributeModel(dto);
    await created.save();
    return created.toObject();
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    active?: boolean;
  }): Promise<{ data: any[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ title: regex }, { titleAr: regex }];
    }

    if (query.categoryId) {
      filter.categoriesIds = new Types.ObjectId(query.categoryId);
    }

    if (query.subcategoryId) {
      filter.subcategoriesIds = new Types.ObjectId(query.subcategoryId);
    }

    if (query.active !== undefined) {
      filter.active = query.active;
    }

    const total = await this.attributeModel.countDocuments(filter);

    const attributes = await this.attributeModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return { data: attributes, total };
  }

  async findOne(id: string): Promise<ProductAttribute> {
    const item = await this.attributeModel.findById(id).lean();
    if (!item) throw new NotFoundException('Product attribute not found');
    return item as any;
  }

  async update(id: string, dto: UpdateProductAttributeDto): Promise<ProductAttribute> {
    const updated = await this.attributeModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Product attribute not found');
    return updated.toObject();
  }

  async updateStatus(id: string, dto: { active: boolean }): Promise<ProductAttribute> {
    const updated = await this.attributeModel.findByIdAndUpdate(
      id,
      { active: dto.active },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Product attribute not found');
    return updated.toObject();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.attributeModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Product attribute not found');
  }
}
