// src/tags/entities/tag.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true })
  nameAr: string;

  @Prop({ required: true })
  nameEn: string;

  @Prop({ required: true })
  permalink: string;

  @Prop({ required: false })
  descriptionAr?: string;

  @Prop({ required: false })
  descriptionEn?: string;

  // ---- SEO Meta (Dynamic Object) ----
  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: false,
  })
  seo?: Record<string, any>;

  // ---- Status ----
  @Prop({ type: Boolean, default: true })
  status: boolean;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
