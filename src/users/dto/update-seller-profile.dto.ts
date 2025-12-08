import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSellerProfileDto {
  @ApiProperty({
    example: 'My Brand Store',
    description: 'Seller brand name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  brandName: string;
}
