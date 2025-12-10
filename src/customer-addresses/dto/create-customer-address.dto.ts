import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressType } from '../entities/customer-address.entity';

export class CreateCustomerAddressDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'User ID (MongoDB ObjectId) - Required for Admin, auto-set from token for User',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid user ID' })
  userId?: string;

  @ApiProperty({
    example: 'home',
    enum: AddressType,
    description: 'Address type',
    default: AddressType.HOME,
  })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;

  @ApiProperty({
    example: 'My Home Address',
    description: 'Address name/label',
  })
  @IsString()
  @IsNotEmpty()
  addressName: string;

  @ApiProperty({
    example: '123 Main Street, Building 5, Apartment 10',
    description: 'Detailed address information',
  })
  @IsString()
  @IsNotEmpty()
  addressDetails: string;

  @ApiProperty({
    example: 'Nasr City',
    description: 'Area/Neighborhood',
  })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({
    example: 'Cairo',
    description: 'City name',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: false,
    description: 'Set as default address',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}




