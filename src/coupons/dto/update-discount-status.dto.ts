import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDiscountStatusDto {
  @ApiProperty({
    example: true,
    description: 'Active status of the discount',
  })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}


