import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  position?: string;
  salary?: number;
  isActive: boolean;
  joinedDate?: Date;
  institution: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaff>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedDate: {
    type: Date
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  }
}, {
  timestamps: true,
  collection: 'staff'
});

// Compound unique index for email and institution
staffSchema.index({ email: 1, institution: 1 }, { unique: true });

// Index for better query performance
staffSchema.index({ institution: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ isActive: 1 });

export const Staff = mongoose.model<IStaff>('Staff', staffSchema); 