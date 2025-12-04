import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true, unique: true })
  slugAr: string;

  @Prop()
  logo: string;

  @Prop({ default: 1 })
  priority: number;

  @Prop({ required: true, default: true })
  active: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
