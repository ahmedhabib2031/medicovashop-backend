import { IsString, IsBoolean, IsArray, IsOptional, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductAttributeDto {
  @ApiProperty({ example: 'Color', description: 'Attribute title in English' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'اللون', description: 'Attribute title in Arabic' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'dropdown', enum: ['dropdown', 'checkbox', 'radio', 'text'], description: 'Type of attribute input' })
  @IsString()
  @IsNotEmpty()
  attributeType: string;

  @ApiProperty({ example: 'grid', description: 'Display layout for the attribute' })
  displayLayout: string;

  @ApiProperty({ 
    example: [{ name: 'Red', nameAr: 'أحمر', value: 'red' }], 
    description: 'Array of attribute values',
    type: [Object],
    required: false
  })
  @IsOptional()
  @IsArray()
  Attributes?: any[];

  @ApiProperty({ example: true, description: 'Whether the attribute is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ 
    example: ['507f1f77bcf86cd799439011'], 
    description: 'Array of category IDs this attribute applies to',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoriesIds?: string[];

  @ApiProperty({ 
    example: ['507f1f77bcf86cd799439012'], 
    description: 'Array of subcategory IDs this attribute applies to',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  subcategoriesIds?: string[];
}
