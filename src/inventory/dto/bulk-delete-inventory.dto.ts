import {
  IsArray,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteInventoryDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of inventory IDs to delete',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one inventory ID is required' })
  @IsMongoId({ each: true, message: 'Each inventory ID must be a valid MongoDB ID' })
  ids: string[];
}

