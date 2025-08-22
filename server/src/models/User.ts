import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  STAFF = 'STAFF',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  institution?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution'
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Index for better query performance
userSchema.index({ institution: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema); 