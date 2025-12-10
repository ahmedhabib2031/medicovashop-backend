import { PartialType } from '@nestjs/mapped-types';
import { CreateSellerStoreDto } from './create-seller-store.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateSellerStoreDto extends PartialType(CreateSellerStoreDto) {
  @ApiProperty({
    example: 'https://example.com/store-image.jpg',
    description: 'Store image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'Medicova Pharmacy', description: 'Store name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '123 Main Street, City, Country',
    description: 'Store address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Store phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  storePhone?: string;

  @ApiProperty({
    example: 'store@example.com',
    description: 'Store email address',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  storeEmail?: string;
}







