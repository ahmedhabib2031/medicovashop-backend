import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountDto } from './create-coupon.dto';

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}
