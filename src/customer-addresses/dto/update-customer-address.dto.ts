import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressType } from '../entities/customer-address.entity';

export class UpdateCustomerAddressDto {
  @ApiProperty({
    example: 'home',
    enum: AddressType,
    description: 'Address type',
    required: false,
  })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;

  @ApiProperty({
    example: 'My Home Address',
    description: 'Address name/label',
    required: false,
  })
  @IsOptional()
  @IsString()
  addressName?: string;

  @ApiProperty({
    example: '123 Main Street, Building 5, Apartment 10',
    description: 'Detailed address information',
    required: false,
  })
  @IsOptional()
  @IsString()
  addressDetails?: string;

  @ApiProperty({
    example: 'Nasr City',
    description: 'Area/Neighborhood',
    required: false,
  })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiProperty({
    example: 'Cairo',
    description: 'City name',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: false,
    description: 'Set as default address',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}










