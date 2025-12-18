import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ProductInventoryDocument = ProductInventory & Document;

@Schema({ timestamps: true })
export class ProductInventoryVariant {
  @Prop({ required: true })
  size: string;

  @Prop({ type: [String], required: true })
  colors: string[];

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;

  @Prop({ type: String, default: null })
  image: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  attributes: Record<string, any>; // Dynamic attributes like price, weight, etc.
}

export const ProductInventoryVariantSchema = SchemaFactory.createForClass(
  ProductInventoryVariant,
);

@Schema({ timestamps: true })
export class ProductInventory {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, unique: true })
  productId: Types.ObjectId;

  @Prop({ type: [ProductInventoryVariantSchema], default: [] })
  variants: ProductInventoryVariant[];

  @Prop({ type: Number, default: 0 })
  totalQuantity: number; // Sum of all variant quantities

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export const ProductInventorySchema =
  SchemaFactory.createForClass(ProductInventory);
