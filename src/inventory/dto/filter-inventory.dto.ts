import {
  IsOptional,
  IsString,
  IsMongoId,
  IsNumber,
  IsEnum,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterInventoryDto {
  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Items per page',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({
    example: 'search term',
    description: 'Search in product names',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Product ID filter',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Multiple Product IDs filter',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: string[];

  @ApiProperty({
    example: 'in_stock',
    description: 'Filter by inventory status',
    enum: ['in_stock', 'out_of_stock'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['in_stock', 'out_of_stock'])
  status?: string;

  @ApiProperty({
    example: 10,
    description: 'Minimum quantity filter',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum quantity filter',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @ApiProperty({
    example: true,
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    example: 'active',
    required: false,
    enum: ['active', 'inactive'],
    description: 'Filter by product status (active or inactive)',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  productStatus?: string;
}

