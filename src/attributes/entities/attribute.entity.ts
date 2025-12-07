import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductAttributeDocument = ProductAttribute & Document;

@Schema({ timestamps: true })
export class ProductAttribute {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  titleAr: string;

  @Prop({ required: true })
  attributeType: string;

  @Prop({ required: true })
  displayLayout: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  Attributes: any[];   // 🔹 Accepts any type (mixed array)

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: [String], default: [] })
  categoriesIds: string[];

  @Prop({ type: [String], default: [] })
  subcategoriesIds: string[];
}

export const ProductAttributeSchema = SchemaFactory.createForClass(ProductAttribute);
