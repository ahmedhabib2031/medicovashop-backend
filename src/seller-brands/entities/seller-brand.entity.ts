import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SellerBrandDocument = SellerBrand & Document;

export enum BrandStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class SellerBrand {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  brandName: string;

  @Prop({ required: true })
  brandWebsiteLink: string;

  @Prop({ required: true })
  brandLogo: string;

  @Prop({
    type: String,
    enum: BrandStatus,
    default: BrandStatus.PENDING,
  })
  status: BrandStatus;

  @Prop({ type: String, default: null })
  rejectionReason: string | null;
}

export const SellerBrandSchema = SchemaFactory.createForClass(SellerBrand);









