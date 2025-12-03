// src/tags/tags.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  async create(dto: CreateTagDto): Promise<Tag> {
    const tag = new this.tagModel(dto);
    await tag.save();
    return tag.toObject();
  }

  async findAll(): Promise<Tag[]> {
    const tags = await this.tagModel.find();
    return tags.map((tag) => tag.toObject());
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagModel.findById(id);
    if (!tag) throw new NotFoundException('Tag not found');
    return tag.toObject();
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagModel.findByIdAndUpdate(id, dto, { new: true });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag.toObject();
  }

  async remove(id: string): Promise<{ message: string }> {
    const tag = await this.tagModel.findByIdAndDelete(id);
    if (!tag) throw new NotFoundException('Tag not found');
    return { message: 'Tag deleted successfully' };
  }
}
