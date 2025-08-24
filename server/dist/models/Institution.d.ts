import mongoose, { Document } from 'mongoose';
export interface IInstitution extends Document {
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    website?: string;
    logo?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Institution: mongoose.Model<IInstitution, {}, {}, {}, mongoose.Document<unknown, {}, IInstitution, {}, {}> & IInstitution & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Institution.d.ts.map