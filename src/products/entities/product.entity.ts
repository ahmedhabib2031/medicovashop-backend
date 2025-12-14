import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  // Basic Information
  @Prop({ required: true })
  nameEn: string; // English name

  @Prop({ required: true })
  nameAr: string; // Arabic name

  @Prop({ required: true, unique: true })
  permalink: string; // URL-friendly slug

  // Identity
  @Prop({ required: true, unique: true })
  sku: string; // Product SKU

  @Prop({ type: String, default: 'auto-generated' })
  skuMode: string; // 'manual' or 'auto-generated'

  // Classification
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId; // Main category

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
  subcategory: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubcategoryChild', required: false })
  childCategory: Types.ObjectId | null; // Child category

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brand: Types.ObjectId;

  @Prop({ type: String, default: 'Physical Product' })
  productType: string; // e.g., 'Physical Product', 'Digital Product', 'Service', etc.

  @Prop({ type: Types.ObjectId, ref: 'SellerStore', required: false })
  store: Types.ObjectId | null;

  // Descriptions
  @Prop({ required: true, type: String })
  descriptionEn: string; // English description

  @Prop({ required: true, type: String })
  descriptionAr: string; // Arabic description

  // Created By
  @Prop({ type: String, default: 'seller' })
  createdBy: string; // 'admin' or 'seller'

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdById: Types.ObjectId | null; // Admin or Seller ID

  // Key Features
  @Prop({
    type: [
      {
        titleEn: { type: String },
        descriptionEn: { type: String },
        titleAr: { type: String },
        descriptionAr: { type: String },
      },
    ],
    default: [],
  })
  keyFeatures: {
    titleEn: string;
    descriptionEn: string;
    titleAr: string;
    descriptionAr: string;
  }[];

  // Media
  @Prop({ type: [String], default: [] })
  featuredImages: string[]; // Featured images array

  @Prop({ type: [String], default: [] })
  galleryImages: string[]; // Gallery images array

  @Prop({ type: String, default: null })
  productVideo: string | null; // External video URL

  // Pricing
  @Prop({ type: Number, required: true })
  originalPrice: number; // Original price

  @Prop({ type: Number, default: null })
  salePrice: number | null; // Sale price

  @Prop({
    type: {
      discountType: { type: String }, // 'percent' or 'fixed' (renamed from 'type' to avoid Mongoose conflict)
      value: { type: Number }, // Discount percentage or fixed amount
      amount: { type: Number }, // Calculated discount amount
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
  })
  discount?: {
    type: string; // 'percent' or 'fixed' (mapped from discountType)
    value: number;
    amount: number;
    startDate: Date | null;
    endDate: Date | null;
  } | null;

  // Inventory
  @Prop({ type: Boolean, default: true })
  trackStock: boolean; // Whether to track stock

  @Prop({ type: Number, default: 0 })
  stockQuantity: number; // Stock quantity

  @Prop({ type: String, default: 'in_stock' })
  stockStatus: string; // 'in_stock', 'out_of_stock', 'low_stock', etc.

  @Prop({ type: String, default: 'simple' })
  inventoryProductType: string; // 'simple', 'variable', etc.

  @Prop({ type: String, default: null })
  skuGenerated: string | null; // Auto-generated SKU if applicable

  // Variants
  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [String], default: [] })
  options: string[]; // Additional variant options

  // Shipping
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  shipping: any; // Shipping information object

  // Specifications
  @Prop({
    type: [
      {
        keyEn: { type: String },
        valueEn: { type: String },
        keyAr: { type: String },
        valueAr: { type: String },
      },
    ],
    default: [],
  })
  specifications: {
    keyEn: string;
    valueEn: string;
    keyAr: string;
    valueAr: string;
  }[];

  // Relations
  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  relatedProducts: Types.ObjectId[]; // Related products

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  crossSellingProducts: Types.ObjectId[]; // Cross-selling products

  // Status
  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  sellerId: Types.ObjectId | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
