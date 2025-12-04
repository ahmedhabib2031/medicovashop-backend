import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SubCategory } from '../../sub-categories/entities/subcategory.entity';

export type SubcategoryChildDocument = SubcategoryChild & Document;

@Schema({ timestamps: true })
export class SubcategoryChild {
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

  @Prop()
  image: string;

  @Prop()
  headline: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

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

  // Parent subcategory reference
  @Prop({ type: Types.ObjectId, ref: SubCategory.name, required: true })
  parentSubCategory: Types.ObjectId;
}

export const SubcategoryChildSchema = SchemaFactory.createForClass(SubcategoryChild);


