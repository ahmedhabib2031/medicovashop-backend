import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteCouponsDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of coupon IDs to delete',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true, message: 'Each ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'At least one coupon ID is required' })
  ids: string[];
}


