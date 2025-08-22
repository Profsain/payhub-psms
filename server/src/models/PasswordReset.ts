import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordReset extends Document {
  token: string;
  expiresAt: Date;
  used: boolean;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  token: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'password_resets'
});

// Index for better query performance
passwordResetSchema.index({ user: 1 });
passwordResetSchema.index({ expiresAt: 1 });

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema); 