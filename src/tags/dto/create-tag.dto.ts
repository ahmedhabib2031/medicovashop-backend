// src/tags/dto/create-tag.dto.ts
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTagDto {
  @IsNotEmpty()
  nameAr: string;

  @IsNotEmpty()
  nameEn: string;

  @IsNotEmpty()
  permalink: string;

  @IsOptional()
  descriptionAr?: string;

  @IsOptional()
  descriptionEn?: string;
}


