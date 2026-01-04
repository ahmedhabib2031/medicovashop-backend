import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductCollectionDocument = ProductCollection & Document;

@Schema({ timestamps: true })
export class ProductCollection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ required: true })
  nameEn: string;

  @Prop({ required: false })
  link?: string;

  @Prop({ required: false, type: String })
  descriptionAr?: string;

  @Prop({ required: false, type: String })
  descriptionEn?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  products: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  descriptiveData?: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  status: boolean;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Boolean, default: false })
  isFeatures: boolean;
}

export const ProductCollectionSchema =
  SchemaFactory.createForClass(ProductCollection);



















