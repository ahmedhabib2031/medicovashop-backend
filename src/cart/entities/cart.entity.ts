import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ _id: false, timestamps: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductInventory', required: false })
  inventoryId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, required: false })
  variantId: Types.ObjectId | null; // Variant ID from inventory

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productNameAr: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: String, default: null })
  size: string | null;

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: String, default: null })
  variantImage: string | null; // Variant image if available

  @Prop({ type: Number, required: true })
  unitPrice: number; // Current price at time of adding to cart

  @Prop({ type: Number, default: 0 })
  discount: number; // Discount amount for this item

  @Prop({ type: Number, required: true })
  subtotal: number; // (unitPrice * quantity) - discount
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ type: Number, default: 0 })
  subtotal: number; // Sum of all items subtotals

  @Prop({ type: Number, default: 0 })
  discountAmount: number; // Total discount from coupon

  @Prop({ type: Types.ObjectId, ref: 'Discount', default: null })
  couponId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  couponCode: string | null;

  @Prop({ type: Number, default: 0 })
  shippingCost: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  total: number; // subtotal - discountAmount + shippingCost + tax

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
