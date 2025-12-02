import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CouponType } from '../dto/create-coupon.dto';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, unique: true })
  couponCode: string;

  @Prop({ default: false })
  promotion: boolean;

  @Prop({ default: false })
  flashSale: boolean;

  @Prop({ default: false })
  unlimitedUses: boolean;

  @Prop({ default: false })
  applyViaUrl: boolean;

  @Prop({ default: true })
  displayAtCheckout: boolean;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ enum: CouponType, required: true })
  couponType: CouponType;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ type: [String], default: [] })
  applyFor: string[];
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
