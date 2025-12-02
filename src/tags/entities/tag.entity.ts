// src/tags/entities/tag.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true })
  nameAr: string;

  @Prop({ required: true })
  nameEn: string;

  @Prop({ required: true, unique: true })
  permalink: string;

  @Prop({ required: false })
  descriptionAr?: string;

  @Prop({ required: false })
  descriptionEn?: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
