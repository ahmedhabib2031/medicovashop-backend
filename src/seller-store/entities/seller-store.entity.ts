import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SellerStoreDocument = SellerStore & Document;

@Schema({ timestamps: true })
export class SellerStore {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop()
  image: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  storePhone: string;

  @Prop({ required: true })
  storeEmail: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export const SellerStoreSchema = SchemaFactory.createForClass(SellerStore);



