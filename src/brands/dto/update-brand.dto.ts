import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { IsBoolean } from 'class-validator';

export class UpdateBrandStatusDto {
  @IsBoolean()
  active: boolean;
}


export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
