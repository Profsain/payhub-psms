"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const createSubscriptionSchema = zod_1.z.object({
    planName: zod_1.z.string().min(1, 'Plan name is required'),
    planPrice: zod_1.z.number().positive('Plan price must be positive'),
    billingCycle: zod_1.z.enum(['monthly', 'yearly'], {
        errorMap: () => ({ message: 'Billing cycle must be monthly or yearly' })
    })
});
router.get('/', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const subscriptions = await models_1.Subscription.find({
            institution: req.user.institution,
        })
            .sort({ createdAt: -1 })
            .lean();
        const subscriptionsWithPayments = await Promise.all(subscriptions.map(async (subscription) => {
            const payments = await models_1.Payment.find({
                subscription: subscription._id,
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();
            return {
                ...subscription,
                payments,
            };
        }));
        return res.json({
            success: true,
            data: subscriptionsWithPayments,
        });
    }
    catch (error) {
        console.error('Get subscriptions error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post('/', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const subscriptionData = createSubscriptionSchema.parse(req.body);
        const activeSubscription = await models_1.Subscription.findOne({
            institution: req.user.institution,
            status: models_1.SubscriptionStatus.ACTIVE,
        });
        if (activeSubscription) {
            return res.status(400).json({
                success: false,
                error: 'Institution already has an active subscription'
            });
        }
        const subscription = new models_1.Subscription({
            ...subscriptionData,
            institution: req.user.institution,
            status: models_1.SubscriptionStatus.PENDING,
            startDate: new Date(),
        });
        await subscription.save();
        return res.status(201).json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error('Create subscription error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await models_1.Subscription.findOne({
            _id: id,
            institution: req.user.institution,
        }).lean();
        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: "Subscription not found",
            });
        }
        const payments = await models_1.Payment.find({
            subscription: id,
        })
            .sort({ createdAt: -1 })
            .lean();
        const subscriptionWithPayments = {
            ...subscription,
            payments,
        };
        return res.json({
            success: true,
            data: subscriptionWithPayments,
        });
    }
    catch (error) {
        console.error("Get subscription error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.put("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = createSubscriptionSchema
            .partial()
            .parse(req.body);
        const existingSubscription = await models_1.Subscription.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!existingSubscription) {
            return res.status(404).json({
                success: false,
                error: "Subscription not found",
            });
        }
        const subscription = await models_1.Subscription.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
        return res.json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error("Update subscription error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.delete("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await models_1.Subscription.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: "Subscription not found",
            });
        }
        subscription.status = models_1.SubscriptionStatus.CANCELLED;
        subscription.endDate = new Date();
        await subscription.save();
        return res.json({
            success: true,
            message: "Subscription cancelled successfully",
        });
    }
    catch (error) {
        console.error("Cancel subscription error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/:id/activate", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await models_1.Subscription.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: "Subscription not found",
            });
        }
        if (subscription.status === models_1.SubscriptionStatus.ACTIVE) {
            return res.status(400).json({
                success: false,
                error: "Subscription is already active",
            });
        }
        await models_1.Subscription.updateMany({
            institution: req.user.institution,
            status: models_1.SubscriptionStatus.ACTIVE,
        }, {
            status: models_1.SubscriptionStatus.SUSPENDED,
            endDate: new Date(),
        });
        subscription.status = models_1.SubscriptionStatus.ACTIVE;
        subscription.startDate = new Date();
        subscription.endDate = undefined;
        await subscription.save();
        return res.json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        console.error("Activate subscription error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get('/plans', (req, res) => {
    const plans = [
        {
            id: 'basic',
            name: 'Basic',
            price: 29000,
            billingCycle: 'monthly',
            features: [
                'Up to 50 staff members',
                'Basic payslip management',
                'Email support',
                'Standard reports',
                'Mobile app access'
            ]
        },
        {
            id: 'professional',
            name: 'Professional',
            price: 79000,
            billingCycle: 'monthly',
            features: [
                'Up to 200 staff members',
                'Advanced payslip management',
                'Priority support',
                'Advanced analytics',
                'Custom branding',
                'API access',
                'Bulk upload features'
            ]
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 199000,
            billingCycle: 'monthly',
            features: [
                'Unlimited staff members',
                'Full payslip automation',
                '24/7 dedicated support',
                'Custom integrations',
                'Advanced security',
                'White-label solution',
                'Dedicated account manager'
            ]
        }
    ];
    res.json({
        success: true,
        data: plans
    });
});
exports.default = router;
//# sourceMappingURL=subscriptions.js.map