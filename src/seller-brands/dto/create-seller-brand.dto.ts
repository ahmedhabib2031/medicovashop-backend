import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSellerBrandDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Seller ID (MongoDB ObjectId) - Required for Admin, auto-set from token for Seller',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid seller ID' })
  sellerId?: string;

  @ApiProperty({
    example: 'Nike',
    description: 'Brand name',
  })
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @ApiProperty({
    example: 'https://www.nike.com',
    description: 'Brand official website link',
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsNotEmpty()
  brandWebsiteLink: string;

  @ApiProperty({
    example: 'https://example.com/brand-logo.png',
    description: 'Brand logo URL',
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsNotEmpty()
  brandLogo: string;
}










