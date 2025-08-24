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
const updateInstitutionSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    phoneNumber: zod_1.z.string().min(10, 'Phone number must be at least 10 characters').optional(),
    address: zod_1.z.string().optional(),
    website: zod_1.z.string().url('Invalid website URL').optional()
});
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(models_1.UserRole.SUPER_ADMIN), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const [institutions, total] = await Promise.all([
            models_1.Institution.find(searchQuery)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            models_1.Institution.countDocuments(searchQuery),
        ]);
        const institutionsWithCounts = await Promise.all(institutions.map(async (institution) => {
            const [userCount, staffCount, payslipCount] = await Promise.all([
                models_1.User.countDocuments({ institution: institution._id }),
                models_1.Staff.countDocuments({ institution: institution._id }),
                models_1.Payslip.countDocuments({
                    institution: institution._id,
                }),
            ]);
            return {
                ...institution,
                _count: {
                    users: userCount,
                    staff: staffCount,
                    payslips: payslipCount,
                },
            };
        }));
        const totalPages = Math.ceil(total / limit);
        return res.json({
            success: true,
            data: {
                institutions: institutionsWithCounts,
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
        console.error('Get institutions error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === models_1.UserRole.INSTITUTION_ADMIN &&
            req.user.institution?.toString() !== id) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        const institution = await models_1.Institution.findById(id).lean();
        if (!institution) {
            return res.status(404).json({
                success: false,
                error: "Institution not found",
            });
        }
        const [userCount, staffCount, payslipCount, subscriptionCount] = await Promise.all([
            models_1.User.countDocuments({ institution: id }),
            models_1.Staff.countDocuments({ institution: id }),
            models_1.Payslip.countDocuments({ institution: id }),
            models_1.Subscription.countDocuments({ institution: id }),
        ]);
        const institutionWithCounts = {
            ...institution,
            _count: {
                users: userCount,
                staff: staffCount,
                payslips: payslipCount,
                subscriptions: subscriptionCount,
            },
        };
        return res.json({
            success: true,
            data: institutionWithCounts,
        });
    }
    catch (error) {
        console.error("Get institution error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = updateInstitutionSchema.parse(req.body);
        if (req.user.role === models_1.UserRole.INSTITUTION_ADMIN &&
            req.user.institution?.toString() !== id) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        const institution = await models_1.Institution.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
        if (!institution) {
            return res.status(404).json({
                success: false,
                error: "Institution not found",
            });
        }
        return res.json({
            success: true,
            data: institution,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error("Update institution error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)(models_1.UserRole.SUPER_ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const institution = await models_1.Institution.findById(id);
        if (!institution) {
            return res.status(404).json({
                success: false,
                error: "Institution not found",
            });
        }
        institution.isActive = false;
        await institution.save();
        return res.json({
            success: true,
            message: "Institution deactivated successfully",
        });
    }
    catch (error) {
        console.error("Delete institution error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=institutions.js.map