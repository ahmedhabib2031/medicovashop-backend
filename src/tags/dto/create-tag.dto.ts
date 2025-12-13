// src/tags/dto/create-tag.dto.ts
import { IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';

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

  @IsOptional()
  @IsObject()
  seo?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
