import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerAddressDocument = CustomerAddress & Document;

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class CustomerAddress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: AddressType,
    default: AddressType.HOME,
  })
  addressType: AddressType;

  @Prop({ required: true })
  addressName: string;

  @Prop({ required: true })
  addressDetails: string;

  @Prop({ required: true })
  area: string;

  @Prop({ required: true })
  city: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export const CustomerAddressSchema = SchemaFactory.createForClass(CustomerAddress);



