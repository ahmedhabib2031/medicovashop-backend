import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryStatusDto {
  @ApiProperty({
    example: true,
    description: 'Active status',
  })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}






