import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsArray,
  IsBoolean,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductCollectionDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Seller ID (MongoDB ObjectId) - Required for Admin, auto-set from token for Seller',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid seller ID' })
  sellerId?: string;

  @ApiProperty({
    example: 'مجموعة المنتجات المميزة',
    description: 'Collection name in Arabic',
  })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiProperty({
    example: 'Featured Products Collection',
    description: 'Collection name in English',
  })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({
    example: 'https://example.com/collection',
    description: 'Collection link/URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  link?: string;

  @ApiProperty({
    example: 'وصف المجموعة بالعربية',
    description: 'Collection description in Arabic',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({
    example: 'Collection description in English',
    description: 'Collection description in English',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of product IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Each product ID must be a valid MongoDB ObjectId' })
  products?: string[];

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Descriptive data reference ID',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid descriptive data ID' })
  descriptiveData?: string;

  @ApiProperty({
    example: true,
    description: 'Collection status (active/inactive)',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Array of image URLs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
  images?: string[];

  @ApiProperty({
    example: false,
    description: 'Whether this collection is featured',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatures?: boolean;
}


