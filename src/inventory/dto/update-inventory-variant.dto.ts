import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryVariantDto {
  @ApiProperty({
    example: 'M',
    description: 'Product size',
    required: false,
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    example: ['Red', 'Black'],
    description: 'Array of colors for this size',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  colors?: string[];

  @ApiProperty({
    example: 10,
    description: 'Quantity for this variant combination',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

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

