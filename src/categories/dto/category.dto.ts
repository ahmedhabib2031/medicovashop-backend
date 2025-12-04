import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class FaqDto {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  nameAr!: string;

  @IsString()
  slug!: string;

  @IsString()
  slugAr!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  faqs?: FaqDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  slugAr?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  faqs?: FaqDto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
  
  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}
