import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadSellerDocumentDto {
  @ApiProperty({
    example: 'https://example.com/id-front.jpg',
    description: 'Front side of ID document URL',
  })
  @IsString()
  @IsNotEmpty()
  idFront: string;

  @ApiProperty({
    example: 'https://example.com/id-back.jpg',
    description: 'Back side of ID document URL',
  })
  @IsString()
  @IsNotEmpty()
  idBack: string;
}







