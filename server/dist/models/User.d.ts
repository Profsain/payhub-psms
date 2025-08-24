import mongoose, { Document } from 'mongoose';
export declare enum UserRole {
    STAFF = "STAFF",
    INSTITUTION_ADMIN = "INSTITUTION_ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phoneNumber?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    institution?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map