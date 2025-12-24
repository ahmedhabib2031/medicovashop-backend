import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  CouponType,
  DiscountMethod,
  AppliesTo,
  Eligibility,
} from '../dto/create-coupon.dto';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  discountName: string;

  @Prop({ enum: DiscountMethod, required: true, default: 'automatic_discount' })
  method: DiscountMethod;

  @Prop({ unique: true, sparse: true })
  discountCode: string; // Only required when method is 'discount_code'

  @Prop({ enum: CouponType, required: true })
  discountType: CouponType; // percentage or fixed

  @Prop({ required: true })
  discountValue: number;

  @Prop({ enum: AppliesTo, required: true, default: 'all_products' })
  appliesTo: AppliesTo;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[]; // When appliesTo is 'specific_products'

  @Prop({ type: [String], default: [] })
  categoryIds: string[]; // When appliesTo is 'specific_categories'

  @Prop({ type: [String], default: [] })
  subcategoryIds: string[]; // When appliesTo is 'specific_subcategories'

  @Prop({ default: true })
  availableOnAllSalesChannels: boolean;

  @Prop({ enum: Eligibility, required: true, default: 'all_customers' })
  eligibility: Eligibility;

  @Prop({ type: [String], default: [] })
  customerSegmentIds: string[]; // When eligibility is 'specific_customer_segments'

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  customerIds: Types.ObjectId[]; // When eligibility is 'specific_customers'

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: String })
  startTime: string; // Time in HH:mm format (EET timezone)

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({ type: String, default: null })
  endTime: string | null; // Time in HH:mm format (EET timezone)

  @Prop({ default: true })
  active: boolean;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
