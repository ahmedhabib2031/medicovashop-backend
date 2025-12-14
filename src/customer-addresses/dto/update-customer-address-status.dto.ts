import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerAddressStatusDto {
  @ApiProperty({
    example: true,
    description: 'Active status',
  })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}










