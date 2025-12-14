import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
    
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  slugAr: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
