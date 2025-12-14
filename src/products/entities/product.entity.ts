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
  @Prop({ type: String, default: null })
  featuredImages: string | null; // Featured image (single)

  @Prop({ type: [String], default: [] })
  galleryImages: string[]; // Gallery images array

  @Prop({
    type: {
      vedioUrl: { type: String, default: null }, // Note: keeping typo as per user request
      imageUrl: { type: String, default: null },
    },
    default: null,
  })
  productVideo: {
    vedioUrl: string | null; // Note: keeping typo as per user request
    imageUrl: string | null;
  } | null;

  // Pricing
  @Prop({ type: Number, required: true })
  originalPrice: number; // Original price

  @Prop({ type: Number, default: null })
  salePrice: number | null; // Sale price

  @Prop({ type: Number, default: null })
  discountAmount: number | null; // Discount amount

  @Prop({ type: Number, default: null })
  discountPercantge: number | null; // Discount percentage (keeping typo as per user request)

  @Prop({ type: Date, default: null })
  startDate: Date | null; // Sale start date

  @Prop({ type: Date, default: null })
  endDate: Date | null; // Sale end date

  // Inventory
  @Prop({ type: Boolean, default: true })
  trackStock: boolean; // Whether to track stock

  @Prop({ type: Number, default: 0 })
  stockQuantity: number; // Stock quantity

  @Prop({ type: String, default: 'in_stock' })
  stockStatus: string; // 'in_stock', 'out_of_stock', 'low_stock', etc.

  @Prop({ type: String, default: 'simple' })
  inventoryProductType: string; // 'simple', 'variable', etc.

  // Variants
  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  variantsItems: any[]; // Variant items array

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  options: any[]; // Additional variant options (array of objects)

  // Shipping
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  shipping: any[]; // Shipping information array

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
