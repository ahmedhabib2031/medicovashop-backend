import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductStatusDto {
  @ApiProperty({
    example: true,
    description: 'Product active status',
  })
  @IsBoolean()
  active: boolean;
}



