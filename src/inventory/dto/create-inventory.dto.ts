import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  ArrayMinSize,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InventoryVariantDto {
  @ApiProperty({
    example: 'M',
    description: 'Product size',
  })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({
    example: ['Red', 'Black'],
    description: 'Array of colors for this size',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  colors: string[];

  @ApiProperty({
    example: 10,
    description: 'Quantity for this variant combination',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    example: 'https://example.com/images/variant-red-m.jpg',
    description: 'Variant image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    example: {
      price: 99.99,
      salePrice: 79.99,
      weight: 0.5,
      sku: 'PROD-S-RED-BLACK-001',
    },
    description: 'Dynamic attributes for this variant (price, salePrice, weight, sku, etc.)',
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class CreateInventoryDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Product ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: [
      {
        size: 'S',
        colors: ['Red', 'Black'],
        quantity: 10,
        attributes: {
          price: 99.99,
          salePrice: 79.99,
          weight: 0.3,
          sku: 'PROD-S-RED-BLACK-001',
        },
      },
      {
        size: 'M',
        colors: ['Green'],
        quantity: 30,
        attributes: {
          price: 109.99,
          salePrice: 89.99,
          weight: 0.4,
          sku: 'PROD-M-GREEN-001',
        },
      },
      {
        size: 'L',
        colors: ['White'],
        quantity: 60,
        attributes: {
          price: 119.99,
          salePrice: null,
          weight: 0.5,
          sku: 'PROD-L-WHITE-001',
        },
      },
    ],
    description: 'Array of inventory variants with dynamic attributes',
    type: [InventoryVariantDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryVariantDto)
  variants: InventoryVariantDto[];
}

