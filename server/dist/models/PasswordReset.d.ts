import mongoose, { Document } from 'mongoose';
export interface IPasswordReset extends Document {
    token: string;
    expiresAt: Date;
    used: boolean;
    user: mongoose.Types.ObjectId;
    createdAt: Date;
}
export declare const PasswordReset: mongoose.Model<IPasswordReset, {}, {}, {}, mongoose.Document<unknown, {}, IPasswordReset, {}, {}> & IPasswordReset & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PasswordReset.d.ts.map