import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SellerWishlistDocument = SellerWishlist & Document;

@Schema({ timestamps: true })
export class SellerWishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  sellerId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  products: Types.ObjectId[];
}

export const SellerWishlistSchema =
  SchemaFactory.createForClass(SellerWishlist);










