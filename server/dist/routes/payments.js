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
const createPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be positive'),
    currency: zod_1.z.string().default('NGN'),
    description: zod_1.z.string().optional(),
    subscriptionId: zod_1.z.string().optional()
});
router.get("/", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const searchQuery = {
            institution: req.user.institution,
        };
        if (status) {
            searchQuery.status = status;
        }
        const [payments, total] = await Promise.all([
            models_1.Payment.find(searchQuery)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate("subscription", "id planName billingCycle")
                .lean(),
            models_1.Payment.countDocuments(searchQuery),
        ]);
        const totalPages = Math.ceil(total / limit);
        return res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Get payments error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const paymentData = createPaymentSchema.parse(req.body);
        const payment = new models_1.Payment({
            ...paymentData,
            institution: req.user.institution,
            status: models_1.PaymentStatus.PENDING,
        });
        await payment.save();
        if (payment.subscription) {
            await payment.populate("subscription", "id planName billingCycle");
        }
        return res.status(201).json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error("Create payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await models_1.Payment.findOne({
            _id: id,
            institution: req.user.institution,
        })
            .populate("subscription", "id planName billingCycle")
            .lean();
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: "Payment not found",
            });
        }
        return res.json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        console.error("Get payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.put("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = createPaymentSchema.partial().parse(req.body);
        const existingPayment = await models_1.Payment.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!existingPayment) {
            return res.status(404).json({
                success: false,
                error: "Payment not found",
            });
        }
        const payment = await models_1.Payment.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("subscription", "id planName billingCycle")
            .lean();
        return res.json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error("Update payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.delete("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await models_1.Payment.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: "Payment not found",
            });
        }
        await models_1.Payment.findByIdAndDelete(id);
        return res.json({
            success: true,
            message: "Payment deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post('/:id/process', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await models_1.Payment.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: "Payment not found",
            });
        }
        if (payment.status !== models_1.PaymentStatus.PENDING) {
            return res.status(400).json({
                success: false,
                error: "Payment is not pending",
            });
        }
        payment.status = models_1.PaymentStatus.COMPLETED;
        payment.stripePaymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await payment.save();
        return res.json({
            success: true,
            data: payment,
            message: "Payment processed successfully",
        });
    }
    catch (error) {
        console.error('Process payment error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/:id/refund", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await models_1.Payment.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: "Payment not found",
            });
        }
        if (payment.status !== models_1.PaymentStatus.COMPLETED) {
            return res.status(400).json({
                success: false,
                error: "Only completed payments can be refunded",
            });
        }
        payment.status = models_1.PaymentStatus.REFUNDED;
        await payment.save();
        return res.json({
            success: true,
            data: payment,
            message: "Payment refunded successfully",
        });
    }
    catch (error) {
        console.error("Refund payment error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map