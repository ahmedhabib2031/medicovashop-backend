import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSellerRootEmailDto {
  @ApiProperty({
    example: 'seller@gmail.com',
    description: 'New seller root/contact email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  newEmail: string;
}








