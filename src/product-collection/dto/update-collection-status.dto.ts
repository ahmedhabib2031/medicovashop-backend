import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCollectionStatusDto {
  @ApiProperty({
    example: true,
    description: 'Active status of the collection',
  })
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}















