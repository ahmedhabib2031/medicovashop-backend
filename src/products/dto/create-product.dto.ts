import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsMongoId,
  IsBoolean,
  IsDateString,
  Min,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SpecificationDto {
  @ApiProperty({ example: 'Material', description: 'Specification key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Cotton', description: 'Specification value' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

class ProductImageVariantDto {
  @ApiProperty({ example: 'Red-Small', description: 'Variant identifier' })
  @IsString()
  @IsNotEmpty()
  variant: string;

  @ApiProperty({
    example: ['https://example.com/variant1.jpg', 'https://example.com/variant2.jpg'],
    description: 'Images for this variant',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];
}

export class CreateProductDto {
  // Basic Information
  @ApiProperty({ example: 'Premium Cotton T-Shirt', description: 'Product name in English' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ example: 'قميص قطني فاخر', description: 'Product name in Arabic' })
  @IsString()
  @IsNotEmpty()
  productNameAr: string;

  @ApiProperty({ example: 'Premium Cotton T-Shirt', description: 'Product title in English' })
  @IsString()
  @IsNotEmpty()
  productTitle: string;

  @ApiProperty({ example: 'قميص قطني فاخر', description: 'Product title in Arabic' })
  @IsString()
  @IsNotEmpty()
  productTitleAr: string;

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

  // Relations
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Category ID',
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
    description: 'Brand ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439014',
    description: 'Store ID (SellerStore)',
  })
  @IsMongoId()
  @IsNotEmpty()
  store: string;

  // Product Identity
  @ApiProperty({
    example: 'PROD-001',
    description: 'Product SKU (can be manual or auto-generated, leave empty to auto-generate)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;

  // Descriptions
  @ApiProperty({
    example: 'High quality cotton t-shirt with comfortable fit',
    description: 'Product description in English',
  })
  @IsString()
  @IsNotEmpty()
  productDescription: string;

  @ApiProperty({
    example: 'قميص قطني عالي الجودة مع قصة مريحة',
    description: 'Product description in Arabic',
  })
  @IsString()
  @IsNotEmpty()
  productDescriptionAr: string;

  // Features
  @ApiProperty({
    example: ['100% Cotton', 'Machine Washable', 'Comfortable Fit'],
    description: 'Key features in English',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyFeatures?: string[];

  @ApiProperty({
    example: ['100% قطن', 'قابل للغسيل في الغسالة', 'قصة مريحة'],
    description: 'Key features in Arabic',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyFeaturesAr?: string[];

  // Highlights
  @ApiProperty({
    example: ['Premium Quality', 'Eco Friendly', 'Best Seller'],
    description: 'Product highlights in English',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productHighlights?: string[];

  @ApiProperty({
    example: ['جودة فاخرة', 'صديق للبيئة', 'الأكثر مبيعاً'],
    description: 'Product highlights in Arabic',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productHighlightsAr?: string[];

  // Delivery
  @ApiProperty({
    example: '3-5 business days',
    description: 'Delivery time',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryTime?: string;

  // Pricing
  @ApiProperty({ example: 99.99, description: 'Product price in USD' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    example: 79.99,
    description: 'Sale price in USD (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Sale start date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Sale end date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  // Inventory & Weight
  @ApiProperty({ example: 100, description: 'Stock quantity', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({
    example: 0.5,
    description: 'Product weight in kg (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    example: [500, 750, 1000],
    description: 'Shipping weights in grams (array)',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  shippingWeight?: number[];

  @ApiProperty({
    example: 30,
    description: 'Length in cm (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiProperty({
    example: 20,
    description: 'Width in cm (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiProperty({
    example: 5,
    description: 'Height in cm (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  // Variants
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

  // Specifications
  @ApiProperty({
    example: [
      { key: 'Material', value: 'Cotton' },
      { key: 'Size', value: 'Medium' },
    ],
    description: 'Product specifications',
    type: [SpecificationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  // Images
  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Main product images URLs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productImages?: string[];

  @ApiProperty({
    example: [
      {
        variant: 'Red-Small',
        images: ['https://example.com/red-small-1.jpg', 'https://example.com/red-small-2.jpg'],
      },
    ],
    description: 'Product image variants',
    type: [ProductImageVariantDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageVariantDto)
  productImageVariants?: ProductImageVariantDto[];

  // Related Products
  @ApiProperty({
    example: ['507f1f77bcf86cd799439015', '507f1f77bcf86cd799439016'],
    description: 'Related product IDs for cross-selling',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  relatedProducts?: string[];

  @ApiProperty({
    example: true,
    description: 'Product active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
