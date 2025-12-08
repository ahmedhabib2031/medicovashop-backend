import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAttributeStatusDto {
  @ApiProperty({ example: true, description: 'Active status of the attribute' })
  @IsBoolean()
  active: boolean;
}




