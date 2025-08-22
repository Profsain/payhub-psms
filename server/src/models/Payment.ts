import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface IPayment extends Document {
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentId?: string;
  stripeInvoiceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  institution: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  stripePaymentId: {
    type: String,
    trim: true
  },
  stripeInvoiceId: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Index for better query performance
paymentSchema.index({ institution: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentId: 1 });
paymentSchema.index({ createdAt: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema); 