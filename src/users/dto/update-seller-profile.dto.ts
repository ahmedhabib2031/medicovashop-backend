import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSellerProfileDto {
  @ApiProperty({
    example: 'My Brand Store',
    description: 'Seller brand name',
    required: false,
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({
    example: 'seller@example.com',
    description: 'Seller contact email',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  SellerContactEmail?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Seller phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number (e.g., +1234567890)',
  })
  phone?: string;
}
