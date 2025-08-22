import mongoose, { Document, Schema } from 'mongoose';

export enum PayslipStatus {
  PROCESSING = 'PROCESSING',
  AVAILABLE = 'AVAILABLE',
  FAILED = 'FAILED'
}

export interface IPayslip extends Document {
  month: string;
  year: number;
  grossPay: number;
  netPay: number;
  deductions?: number;
  allowances?: number;
  status: PayslipStatus;
  filePath?: string;
  fileName?: string;
  uploadDate: Date;
  processedAt?: Date;
  user?: mongoose.Types.ObjectId;
  staff?: mongoose.Types.ObjectId;
  institution: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payslipSchema = new Schema<IPayslip>({
  month: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  grossPay: {
    type: Number,
    required: true,
    min: 0
  },
  netPay: {
    type: Number,
    required: true,
    min: 0
  },
  deductions: {
    type: Number,
    min: 0
  },
  allowances: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(PayslipStatus),
    default: PayslipStatus.PROCESSING
  },
  filePath: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  staff: {
    type: Schema.Types.ObjectId,
    ref: 'Staff'
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }
}, {
  timestamps: true,
  collection: 'payslips'
});

// Compound unique index for month, year, and staff
payslipSchema.index({ month: 1, year: 1, staff: 1 }, { unique: true });

// Index for better query performance
payslipSchema.index({ institution: 1 });
payslipSchema.index({ status: 1 });
payslipSchema.index({ month: 1, year: 1 });
payslipSchema.index({ user: 1 });
payslipSchema.index({ staff: 1 });

export const Payslip = mongoose.model<IPayslip>('Payslip', payslipSchema); 