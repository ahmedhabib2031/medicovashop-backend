import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SellerDocumentDocument = SellerDocument & Document;

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class SellerDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  idFront: string;

  @Prop({ required: true })
  idBack: string;

  @Prop({
    type: String,
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Prop({ type: String, default: null })
  rejectionReason: string | null;
}

export const SellerDocumentSchema =
  SchemaFactory.createForClass(SellerDocument);













