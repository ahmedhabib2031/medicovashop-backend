import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  // ---- Category Setup ----
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true, unique: true })
  slugAr: string;

  @Prop()
  icon: string;

  // ---- Category Image ----
  @Prop()
  image: string;

  // ---- Category Headline ----
  @Prop()
  headline: string;

  // ---- Description ----
  @Prop({ required: true })
  description: string;
    
  @Prop({ required: true, default: true })
  active: boolean;

  // ---- SEO Meta ----
  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

  // ---- FAQs ----
  @Prop({
    type: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    default: [],
  })
  faqs: { question: string; answer: string }[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
