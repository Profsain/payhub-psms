import mongoose, { Document } from 'mongoose';
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
export declare const Staff: mongoose.Model<IStaff, {}, {}, {}, mongoose.Document<unknown, {}, IStaff, {}, {}> & IStaff & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Staff.d.ts.map