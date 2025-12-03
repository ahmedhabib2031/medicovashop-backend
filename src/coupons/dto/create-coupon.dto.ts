import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  IsEnum,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export class CreateDiscountDto {
  @IsNotEmpty()
  @IsString()
  couponCode: string;

  @IsBoolean()
  @IsOptional()
  promotion?: boolean;

  @IsBoolean()
  @IsOptional()
  flashSale?: boolean;

  @IsBoolean()
  unlimitedUses: boolean;

  @IsBoolean()
  applyViaUrl: boolean;

  @IsBoolean()
  displayAtCheckout: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // <-- important: converts string to Date
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // <-- important
  endDate?: Date;

  @IsEnum(CouponType)
  couponType: CouponType;

  @IsNumber()
  discountValue: number;

  @IsArray()
  @IsOptional()
  applyFor?: string[]; // product IDs, category IDs, or ["all"]
}
