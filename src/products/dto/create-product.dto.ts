import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsMongoId,
  IsBoolean,
  IsDateString,
  IsEnum,
  Min,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Identity DTO
class IdentityDto {
  @ApiProperty({
    example: 'PROD-001',
    description: 'Product SKU (required if skuMode is manual)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    example: 'manual',
    description: 'SKU mode: manual or auto-generated',
    enum: ['manual', 'auto-generated'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['manual', 'auto-generated'])
  skuMode?: string;
}

// Classification DTO
class ClassificationDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Main Category ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Subcategory ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  subcategory: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    description: 'Child Category ID (optional)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  childCategory?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439014',
    description: 'Brand ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({
    example: 'Physical Product',
    description: 'Product type',
    required: false,
  })
  @IsOptional()
  @IsString()
  productType?: string;
}

// Descriptions DTO
class DescriptionsDto {
  @ApiProperty({
    example: 'High quality cotton t-shirt with comfortable fit',
    description: 'Product description in English',
  })
  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @ApiProperty({
    example: 'قميص قطني عالي الجودة مع قصة مريحة',
    description: 'Product description in Arabic',
  })
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;
}

// Key Feature DTO
class KeyFeatureDto {
  @ApiProperty({ example: 'Premium Quality', description: 'Feature title in English' })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiProperty({ example: 'Made with high-quality materials', description: 'Feature description in English' })
  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @ApiProperty({ example: 'جودة فاخرة', description: 'Feature title in Arabic' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'مصنوع من مواد عالية الجودة', description: 'Feature description in Arabic' })
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;
}

// Discount DTO
class DiscountDto {
  @ApiProperty({
    example: 'percent',
    description: 'Discount type (percent or fixed)',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    example: 10,
    description: 'Discount value',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiProperty({
    example: 10,
    description: 'Discount amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Discount start date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Discount end date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

// Pricing DTO
class PricingDto {
  @ApiProperty({ example: 99.99, description: 'Original price' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  originalPrice: number;

  @ApiProperty({
    example: 79.99,
    description: 'Sale price (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiProperty({
    example: 10,
    description: 'Discount amount (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercantge?: number; // Note: keeping typo as per user request

  @ApiProperty({
    description: 'Discount information (optional)',
    type: DiscountDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Sale start date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Sale end date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

// Inventory DTO
class InventoryDto {
  @ApiProperty({
    example: true,
    description: 'Whether to track stock',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiProperty({
    example: 100,
    description: 'Stock quantity',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({
    example: 'in_stock',
    description: 'Stock status',
    required: false,
  })
  @IsOptional()
  @IsString()
  stockStatus?: string;

  @ApiProperty({
    example: 'simple',
    description: 'Product type for inventory',
    required: false,
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiProperty({
    example: 'PROD-001',
    description: 'Generated SKU (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  skuGenerated?: string;
}

// Variants DTO
class VariantsDto {
  @ApiProperty({
    example: ['S', 'M', 'L', 'XL'],
    description: 'Available sizes',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @ApiProperty({
    example: ['Red', 'Blue', 'Green'],
    description: 'Available colors',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiProperty({
    example: [{}, {}],
    description: 'Variant items array',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  variantsItems?: any[];

  @ApiProperty({
    example: [{}, {}],
    description: 'Additional variant options (array of objects)',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  options?: any[];
}

// Specification DTO
class SpecificationDto {
  @ApiProperty({ example: 'Material', description: 'Specification key in English' })
  @IsString()
  @IsNotEmpty()
  keyEn: string;

  @ApiProperty({ example: 'Cotton', description: 'Specification value in English' })
  @IsString()
  @IsNotEmpty()
  valueEn: string;

  @ApiProperty({ example: 'الخامة', description: 'Specification key in Arabic' })
  @IsString()
  @IsNotEmpty()
  keyAr: string;

  @ApiProperty({ example: 'قطن', description: 'Specification value in Arabic' })
  @IsString()
  @IsNotEmpty()
  valueAr: string;
}

// Product Video DTO
class ProductVideoDto {
  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=example123',
    description: 'Video URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  vedioUrl?: string; // Note: keeping typo as per user request

  @ApiProperty({
    example: 'https://example.com/video-thumbnail.jpg',
    description: 'Video thumbnail image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

// Media DTO
class MediaDto {
  @ApiProperty({
    example: 'https://example.com/images/gallery1.jpg',
    description: 'Featured image URL (single)',
    required: false,
  })
  @IsOptional()
  @IsString()
  featuredImages?: string;

  @ApiProperty({
    example: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg'],
    description: 'Gallery images URLs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @ApiProperty({
    description: 'Product video information',
    type: ProductVideoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductVideoDto)
  productVideo?: ProductVideoDto;
}

// Cross Selling Product DTO
class CrossSellingProductDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439017',
    description: 'Cross-selling product ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 50,
    description: 'Price value (fixed amount or percentage)',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    example: 'fixed',
    description: 'Price type: fixed or percentage',
    enum: ['fixed', 'percentage'],
  })
  @IsEnum(['fixed', 'percentage'])
  @IsNotEmpty()
  type: 'fixed' | 'percentage';
}

// Relations DTO
class RelationsDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439015', '507f1f77bcf86cd799439016'],
    description: 'Related product IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  relatedProducts?: string[];

  @ApiProperty({
    example: [
      {
        productId: '507f1f77bcf86cd799439017',
        price: 50,
        type: 'fixed',
      },
      {
        productId: '507f1f77bcf86cd799439018',
        price: 10,
        type: 'percentage',
      },
    ],
    description: 'Cross-selling products with price and type',
    type: [CrossSellingProductDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrossSellingProductDto)
  crossSellingProducts?: CrossSellingProductDto[];
}

// Main Create Product DTO
export class CreateProductDto {
  // Basic Information
  @ApiProperty({ example: 'Premium Cotton T-Shirt', description: 'Product name in English' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ example: 'قميص قطني فاخر', description: 'Product name in Arabic' })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiProperty({
    example: 'premium-cotton-t-shirt',
    description: 'URL-friendly permalink (slug)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Permalink must be lowercase alphanumeric with hyphens only',
  })
  permalink: string;

  // Identity
  @ApiProperty({
    description: 'Product identity (SKU and mode)',
    type: IdentityDto,
  })
  @ValidateNested()
  @Type(() => IdentityDto)
  identity: IdentityDto;

  // Classification
  @ApiProperty({
    description: 'Product classification (category, subcategory, brand, etc.)',
    type: ClassificationDto,
  })
  @ValidateNested()
  @Type(() => ClassificationDto)
  classification: ClassificationDto;

  // Descriptions
  @ApiProperty({
    description: 'Product descriptions in English and Arabic',
    type: DescriptionsDto,
  })
  @ValidateNested()
  @Type(() => DescriptionsDto)
  descriptions: DescriptionsDto;

  // Created By
  @ApiProperty({
    example: 'seller',
    description: 'Who created the product: admin or seller',
    enum: ['admin', 'seller'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['admin', 'seller'])
  createdBy?: string;

  // Key Features
  @ApiProperty({
    description: 'Key features with titles and descriptions in both languages',
    type: [KeyFeatureDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyFeatureDto)
  keyFeatures?: KeyFeatureDto[];

  // Media
  @ApiProperty({
    description: 'Product media (images and video)',
    type: MediaDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MediaDto)
  media?: MediaDto;

  // Pricing
  @ApiProperty({
    description: 'Product pricing information',
    type: PricingDto,
  })
  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  // Inventory
  @ApiProperty({
    description: 'Product inventory information',
    type: InventoryDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InventoryDto)
  inventory?: InventoryDto;

  // Variants
  @ApiProperty({
    description: 'Product variants (sizes, colors, options)',
    type: VariantsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VariantsDto)
  variants?: VariantsDto;

  // Shipping
  @ApiProperty({
    description: 'Shipping information (array of objects)',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  shipping?: any[];

  // Specifications
  @ApiProperty({
    description: 'Product specifications',
    type: [SpecificationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  // Relations
  @ApiProperty({
    description: 'Product relations (related and cross-selling products)',
    type: RelationsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RelationsDto)
  relations?: RelationsDto;

  // Store (required for seller, optional for admin)
  @ApiProperty({
    example: '507f1f77bcf86cd799439014',
    description: 'Store ID (SellerStore) - required for seller (will use first store if not provided), optional for admin',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  store?: string;
}
