import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  IsEnum,
  IsNumber,
  IsArray,
  IsMongoId,
  ValidateIf,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum DiscountMethod {
  DISCOUNT_CODE = 'discount_code',
  AUTOMATIC_DISCOUNT = 'automatic_discount',
}

export enum AppliesTo {
  ALL_PRODUCTS = 'all_products',
  SPECIFIC_PRODUCTS = 'specific_products',
  SPECIFIC_CATEGORIES = 'specific_categories',
  SPECIFIC_SUBCATEGORIES = 'specific_subcategories',
}

export enum Eligibility {
  ALL_CUSTOMERS = 'all_customers',
  SPECIFIC_CUSTOMER_SEGMENTS = 'specific_customer_segments',
  SPECIFIC_CUSTOMERS = 'specific_customers',
}

export class CreateDiscountDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Seller ID (MongoDB ObjectId) - Required for Admin, auto-set from token for Seller',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid seller ID' })
  sellerId?: string;

  @ApiProperty({
    example: 'Summer Sale 2024',
    description: 'Discount name',
  })
  @IsNotEmpty()
  @IsString()
  discountName: string;

  @ApiProperty({
    example: 'automatic_discount',
    enum: DiscountMethod,
    description: 'Discount method: discount_code or automatic_discount',
    default: 'automatic_discount',
  })
  @IsEnum(DiscountMethod)
  @IsOptional()
  method?: DiscountMethod;

  @ApiProperty({
    example: 'SUMMER2024',
    description: 'Discount code (required when method is discount_code)',
    required: false,
  })
  @ValidateIf((o) => o.method === DiscountMethod.DISCOUNT_CODE)
  @IsNotEmpty()
  @IsString()
  discountCode?: string;

  @ApiProperty({
    example: 'percentage',
    enum: CouponType,
    description: 'Discount type: percentage or fixed',
  })
  @IsEnum(CouponType)
  @IsNotEmpty()
  discountType: CouponType;

  @ApiProperty({
    example: 20,
    description: 'Discount value (percentage or fixed amount). For percentage, value must be between 0-100. For fixed, value must be greater than 0.',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  discountValue: number;

  @ApiProperty({
    example: 'specific_products',
    enum: AppliesTo,
    description: 'What the discount applies to',
    default: 'all_products',
  })
  @IsEnum(AppliesTo)
  @IsOptional()
  appliesTo?: AppliesTo;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Product IDs (required when appliesTo is specific_products)',
    required: false,
    type: [String],
  })
  @ValidateIf((o) => o.appliesTo === AppliesTo.SPECIFIC_PRODUCTS)
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  productIds?: string[];

  @ApiProperty({
    example: ['cat1', 'cat2'],
    description: 'Category IDs (required when appliesTo is specific_categories)',
    required: false,
    type: [String],
  })
  @ValidateIf((o) => o.appliesTo === AppliesTo.SPECIFIC_CATEGORIES)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  categoryIds?: string[];

  @ApiProperty({
    example: ['subcat1', 'subcat2'],
    description: 'Subcategory IDs (required when appliesTo is specific_subcategories)',
    required: false,
    type: [String],
  })
  @ValidateIf((o) => o.appliesTo === AppliesTo.SPECIFIC_SUBCATEGORIES)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  subcategoryIds?: string[];

  @ApiProperty({
    example: true,
    description: 'Available on all sales channels',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  availableOnAllSalesChannels?: boolean;

  @ApiProperty({
    example: 'specific_customer_segments',
    enum: Eligibility,
    description: 'Customer eligibility',
    default: 'all_customers',
  })
  @IsEnum(Eligibility)
  @IsOptional()
  eligibility?: Eligibility;

  @ApiProperty({
    example: ['segment1', 'segment2'],
    description: 'Customer segment IDs (required when eligibility is specific_customer_segments)',
    required: false,
    type: [String],
  })
  @ValidateIf((o) => o.eligibility === Eligibility.SPECIFIC_CUSTOMER_SEGMENTS)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  customerSegmentIds?: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Customer IDs (required when eligibility is specific_customers)',
    required: false,
    type: [String],
  })
  @ValidateIf((o) => o.eligibility === Eligibility.SPECIFIC_CUSTOMERS)
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  customerIds?: string[];

  @ApiProperty({
    example: '2024-06-01',
    description: 'Start date',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({
    example: '09:00',
    description: 'Start time in HH:mm format (EET timezone)',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    example: '2024-06-30',
    description: 'End date (optional)',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({
    example: '23:59',
    description: 'End time in HH:mm format (EET timezone)',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiProperty({
    example: true,
    description: 'Active status',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
