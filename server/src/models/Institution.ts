import mongoose, { Document, Schema } from 'mongoose';

export interface IInstitution extends Document {
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const institutionSchema = new Schema<IInstitution>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'institutions'
});

// Index for better query performance
institutionSchema.index({ name: 1 });

export const Institution = mongoose.model<IInstitution>('Institution', institutionSchema); 