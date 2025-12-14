import { IsString, IsEmail, IsOptional, Matches, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSellerProfileDto {
  @ApiProperty({
    example: 'John',
    description: 'First name',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    example: 'Medicova Seller brand name',
    description: 'Seller brand name',
    required: false,
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({
    example: 'seller@medicova.net',
    description: 'Seller contact email',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  sellerContactEmail?: string;

  @ApiProperty({
    example: '+201234567890',
    description: 'Seller phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number (e.g., +201234567890)',
  })
  phone?: string;

  @ApiProperty({
    example: 'Egypt',
    description: 'Country',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: 'Cairo',
    description: 'State/Province',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    example: 'Nasr City',
    description: 'City',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile image URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  profileImage?: string;
}
