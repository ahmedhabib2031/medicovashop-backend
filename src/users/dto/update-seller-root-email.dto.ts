import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateSellerRootEmailDto {
  @ApiProperty({
    example: 'seller-login@medicova.net',
    description: 'New root login email for the seller account',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  newEmail: string;
}







