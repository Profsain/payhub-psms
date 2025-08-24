import mongoose, { Document } from 'mongoose';
export interface IAuditLog extends Document {
    action: string;
    entityType: string;
    entityId: string;
    userId?: string;
    institutionId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AuditLog.d.ts.map