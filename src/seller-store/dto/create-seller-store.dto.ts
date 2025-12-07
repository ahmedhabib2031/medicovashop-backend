import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSellerStoreDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Seller ID (MongoDB ObjectId) - Required for Admin, auto-set from token for Seller',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid seller ID' })
  sellerId?: string;

  @ApiProperty({
    example: 'https://example.com/store-image.jpg',
    description: 'Store image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'Medicova Pharmacy', description: 'Store name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123 Main Street, City, Country',
    description: 'Store address',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Store phone number',
  })
  @IsString()
  @IsNotEmpty()
  storePhone: string;

  @ApiProperty({
    example: 'store@example.com',
    description: 'Store email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  storeEmail: string;
}

