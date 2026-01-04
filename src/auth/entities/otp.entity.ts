import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, default: Date.now, expires: 600 }) // Expires in 10 minutes (600 seconds)
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ default: 0 })
  attempts: number; // Number of verification attempts
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Create index for faster lookups
OtpSchema.index({ email: 1, verified: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });








