import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  // Basic Information
  @Prop({ required: true })
  productName: string; // English

  @Prop({ required: true })
  productNameAr: string; // Arabic

  @Prop({ required: true })
  productTitle: string; // English

  @Prop({ required: true })
  productTitleAr: string; // Arabic

  @Prop({ required: true, unique: true })
  permalink: string; // URL-friendly slug

  // Relations
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
  subcategory: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brand: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SellerStore', required: true })
  store: Types.ObjectId;

  // Product Identity
  @Prop({ required: true, unique: true })
  sku: string; // Can be manual or auto-generated

  // Descriptions
  @Prop({ required: true, type: String })
  productDescription: string; // English

  @Prop({ required: true, type: String })
  productDescriptionAr: string; // Arabic

  // Features
  @Prop({ type: [String], default: [] })
  keyFeatures: string[]; // English array

  @Prop({ type: [String], default: [] })
  keyFeaturesAr: string[]; // Arabic array

  // Highlights
  @Prop({ type: [String], default: [] })
  productHighlights: string[]; // English array

  @Prop({ type: [String], default: [] })
  productHighlightsAr: string[]; // Arabic array

  // Delivery
  @Prop({ type: String, default: null })
  deliveryTime: string | null;

  // Pricing
  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: null })
  salePrice: number | null;

  @Prop({ type: Date, default: null })
  saleStartDate: Date | null;

  @Prop({ type: Date, default: null })
  saleEndDate: Date | null;

  // Inventory & Weight
  @Prop({ type: Number, default: 0 })
  stockQuantity: number;

  @Prop({ type: Number, default: null })
  weight: number | null; // Weight in kg

  @Prop({ type: [Number], default: [] })
  shippingWeight: number[]; // Array of weights in grams

  @Prop({ type: Number, default: null })
  length: number | null; // Length in cm

  @Prop({ type: Number, default: null })
  width: number | null; // Width in cm

  @Prop({ type: Number, default: null })
  height: number | null; // Height in cm

  // Variants
  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  // Specifications
  @Prop({ type: [{ key: String, value: String }], default: [] })
  specifications: { key: string; value: string }[];

  // Images
  @Prop({ type: [String], default: [] })
  productImages: string[]; // Main product images

  @Prop({ type: [{ variant: String, images: [String] }], default: [] })
  productImageVariants: { variant: string; images: string[] }[];

  // Related Products
  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  relatedProducts: Types.ObjectId[]; // Cross-selling products

  // Status
  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  sellerId: Types.ObjectId | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
