import {
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryVariantDto {
  @ApiProperty({
    example: 'M',
    description: 'Variant size to match',
  })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({
    example: ['Red', 'Black'],
    description: 'Variant colors to match (order does not matter)',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  colors: string[];

  @ApiProperty({
    example: 25,
    description: 'New quantity for this variant combination',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({
    example: { price: 99.99, salePrice: 79.99, sku: 'PROD-M-RED-BLACK-001' },
    description: 'New/updated dynamic attributes for this variant',
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @ApiProperty({
    example: 'https://example.com/variant-m-red-black.jpg',
    description: 'New image URL for this variant combination',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  image?: string;
}


