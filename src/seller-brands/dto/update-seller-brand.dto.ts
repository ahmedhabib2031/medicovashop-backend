import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSellerBrandDto {
  @ApiProperty({
    example: 'Nike',
    description: 'Brand name',
    required: false,
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({
    example: 'https://www.nike.com',
    description: 'Brand official website link',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  brandWebsiteLink?: string;

  @ApiProperty({
    example: 'https://example.com/brand-logo.png',
    description: 'Brand logo URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  brandLogo?: string;
}









