// src/tags/tags.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  async create(dto: CreateTagDto): Promise<Tag> {
    // Check if permalink already exists
    const existingTag = await this.tagModel.findOne({
      permalink: dto.permalink,
    });
    if (existingTag) {
      throw new BadRequestException('TAG_PERMALINK_ALREADY_EXISTS');
    }

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
    // Check if tag exists
    const existingTag = await this.tagModel.findById(id);
    if (!existingTag) {
      throw new NotFoundException('Tag not found');
    }

    // Check if permalink is being updated and if it already exists
    if (dto.permalink && dto.permalink !== existingTag.permalink) {
      const duplicateTag = await this.tagModel.findOne({
        permalink: dto.permalink,
      });
      if (duplicateTag) {
        throw new BadRequestException('TAG_PERMALINK_ALREADY_EXISTS');
      }
    }

    const tag = await this.tagModel.findByIdAndUpdate(id, dto, { new: true });
    return tag.toObject();
  }

  async remove(id: string): Promise<{ message: string }> {
    const tag = await this.tagModel.findByIdAndDelete(id);
    if (!tag) throw new NotFoundException('Tag not found');
    return { message: 'Tag deleted successfully' };
  }
}
