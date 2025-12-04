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
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
