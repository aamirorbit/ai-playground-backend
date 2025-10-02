import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findByClerkUserId(clerkUserId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ clerkUserId }).exec();
  }

  async createFromClerk(userData: {
    clerkUserId: string;
    email: string;
    name: string;
    isVerified: boolean;
  }): Promise<UserDocument> {
    return this.userModel.create(userData);
  }

  async findOrCreateFromClerk(userData: {
    clerkUserId: string;
    email: string;
    name: string;
    isVerified: boolean;
  }): Promise<UserDocument> {
    // First, try to find by Clerk user ID
    let user = await this.findByClerkUserId(userData.clerkUserId);
    
    if (user) {
      return user;
    }
    
    // If not found by clerkUserId, check if user exists with this email
    // (might be from old auth system or partial sign-up)
    user = await this.userModel.findOne({ email: userData.email }).exec();
    
    if (user) {
      // Update existing user with Clerk ID and other info
      user.clerkUserId = userData.clerkUserId;
      user.name = userData.name || user.name;
      user.isVerified = userData.isVerified;
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }
    
    // User doesn't exist at all, create new one
    try {
      user = await this.createFromClerk(userData);
      return user;
    } catch (error) {
      // Handle race condition: another request might have created the user
      if (error.code === 11000) {
        // Duplicate key error - try to find the user again
        user = await this.findByClerkUserId(userData.clerkUserId);
        if (!user) {
          user = await this.userModel.findOne({ email: userData.email }).exec();
        }
        if (user) {
          return user;
        }
      }
      throw error;
    }
  }
}

