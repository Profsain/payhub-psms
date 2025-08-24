import mongoose, { Document } from 'mongoose';
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    CANCELLED = "CANCELLED",
    PENDING = "PENDING"
}
export interface ISubscription extends Document {
    planName: string;
    planPrice: number;
    billingCycle: string;
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
export declare const Subscription: mongoose.Model<ISubscription, {}, {}, {}, mongoose.Document<unknown, {}, ISubscription, {}, {}> & ISubscription & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Subscription.d.ts.map