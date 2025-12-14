import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BrandStatus } from '../entities/seller-brand.entity';

export class UpdateBrandStatusDto {
  @ApiProperty({
    example: 'approved',
    enum: BrandStatus,
    description: 'Brand status (approved, pending, or rejected)',
  })
  @IsEnum(BrandStatus, {
    message: 'Status must be approved, pending, or rejected',
  })
  status: BrandStatus;

  @ApiProperty({
    example: 'Brand name already exists',
    description: 'Rejection reason (required if status is rejected)',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}










