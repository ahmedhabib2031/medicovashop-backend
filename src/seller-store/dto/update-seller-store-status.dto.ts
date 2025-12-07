import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSellerStoreStatusDto {
  @ApiProperty({
    example: true,
    description: 'Store active status',
  })
  @IsBoolean()
  active: boolean;
}

