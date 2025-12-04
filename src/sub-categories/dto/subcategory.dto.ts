import { IsString, IsOptional, IsBoolean, IsArray, IsMongoId } from 'class-validator';

export class FaqDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class CreateSubCategoryDto {
  @IsString()
  name: string;

  @IsString()
  nameAr: string;

  @IsString()
  slug: string;

  @IsString()
  slugAr: string;

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
  description: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  metaKeywords?: string[];

  @IsOptional()
  @IsArray()
  faqs?: FaqDto[];

  @IsMongoId()
  parentCategory: string;
}

export class UpdateSubCategoryDto extends CreateSubCategoryDto {}

export class UpdateSubCategoryStatusDto {
  @IsBoolean()
  active: boolean;
}
