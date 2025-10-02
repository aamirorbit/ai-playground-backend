import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: false, unique: true, sparse: true })
  clerkUserId?: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: false })
  verificationCode?: string;

  @Prop({ required: false })
  verificationCodeExpiry?: Date;

  @Prop({ required: false })
  refreshToken?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: Date.now })
  lastLoginAt?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ clerkUserId: 1 });
UserSchema.index({ verificationCode: 1 });
UserSchema.index({ refreshToken: 1 });