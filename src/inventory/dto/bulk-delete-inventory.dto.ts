import {
  IsArray,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteInventoryDto {
  @ApiProperty({
    example: [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      '694433d9a438b2154ed0b006',
    ],
    description:
      'Array of inventory IDs or variant IDs to delete. If inventory ID, deletes entire inventory. If variant ID, deletes only that variant.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one ID is required' })
  @IsMongoId({ each: true, message: 'Each ID must be a valid MongoDB ID' })
  ids: string[];
}

