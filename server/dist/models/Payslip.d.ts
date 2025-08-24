import mongoose, { Document } from 'mongoose';
export declare enum PayslipStatus {
    PROCESSING = "PROCESSING",
    AVAILABLE = "AVAILABLE",
    FAILED = "FAILED"
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
export declare const Payslip: mongoose.Model<IPayslip, {}, {}, {}, mongoose.Document<unknown, {}, IPayslip, {}, {}> & IPayslip & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payslip.d.ts.map