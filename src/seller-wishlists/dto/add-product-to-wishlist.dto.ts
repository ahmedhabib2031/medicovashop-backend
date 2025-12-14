import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddProductToWishlistDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of product IDs to add to wishlist',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true, message: 'Each product ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  productIds: string[];
}










