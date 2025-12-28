import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemToCartDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Product ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Inventory ID (optional)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  inventoryId?: string;

  @ApiProperty({
    example: '694433d9a438b2154ed0b006',
    description: 'Variant ID from inventory (optional)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  variantId?: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity to add to cart',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    example: 'M',
    description: 'Product size (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    example: ['Red', 'Black'],
    description: 'Product colors (optional)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];
}
















