// entities/user.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, default: null })
  firstName: string | null;

  @Prop({ type: String, default: null })
  lastName: string | null;

  @Prop({ type: String, default: null })
  brandName: string | null;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, default: null })
  phone: string | null;

  @Prop({ type: String, default: null })
  SellerContactEmail: string | null;

  @Prop({ type: String, default: null })
  country: string | null;

  @Prop({ type: String, default: null })
  state: string | null;

  @Prop({ type: String, default: null })
  city: string | null;

  @Prop({ type: String, default: null })
  profileImage: string | null;

  @Prop({ type: String, enum: ['ar', 'en'], default: 'en' })
  language: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: String, default: null })
  currentHashedRefreshToken: string;

  @Prop({ type: Date, default: null })
  refreshTokenExpiresAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
