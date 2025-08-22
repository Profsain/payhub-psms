import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING'
}

export interface ISubscription extends Document {
  planName: string;
  planPrice: number;
  billingCycle: string; // monthly, yearly
  status: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  trialEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  institution: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  planName: {
    type: String,
    required: true,
    trim: true
  },
  planPrice: {
    type: Number,
    required: true,
    min: 0
  },
  billingCycle: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly']
  },
  status: {
    type: String,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.PENDING
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  trialEndDate: {
    type: Date
  },
  stripeCustomerId: {
    type: String,
    trim: true
  },
  stripeSubscriptionId: {
    type: String,
    trim: true
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

// Index for better query performance
subscriptionSchema.index({ institution: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema); 