import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 3,
    description: 'New quantity for the cart item',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}






















