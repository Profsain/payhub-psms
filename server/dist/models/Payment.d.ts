import mongoose, { Document } from 'mongoose';
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
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
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.d.ts.map