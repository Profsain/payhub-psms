"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_PATH || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payslip-' + uniqueSuffix + '.pdf');
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});
const createPayslipSchema = zod_1.z.object({
    month: zod_1.z.string().min(1, 'Month is required'),
    year: zod_1.z.number().int().min(2020, 'Year must be 2020 or later'),
    grossPay: zod_1.z.number().positive('Gross pay must be positive'),
    netPay: zod_1.z.number().positive('Net pay must be positive'),
    deductions: zod_1.z.number().optional(),
    allowances: zod_1.z.number().optional(),
    staffId: zod_1.z.string().optional()
});
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const month = req.query.month;
        const year = req.query.year;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const searchQuery = {};
        if (req.user.role === "STAFF") {
            searchQuery.user = req.user.id;
        }
        else {
            searchQuery.institution = req.user.institution;
        }
        if (month) {
            searchQuery.month = month;
        }
        if (year) {
            searchQuery.year = parseInt(year);
        }
        if (status) {
            searchQuery.status = status;
        }
        const [payslips, total] = await Promise.all([
            models_1.Payslip.find(searchQuery)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate("staff", "id name email department")
                .lean(),
            models_1.Payslip.countDocuments(searchQuery),
        ]);
        const totalPages = Math.ceil(total / limit);
        return res.json({
            success: true,
            data: {
                payslips,
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
        console.error('Get payslips error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post('/', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const payslipData = createPayslipSchema.parse(req.body);
        if (payslipData.staffId) {
            const existingPayslip = await models_1.Payslip.findOne({
                month: payslipData.month,
                year: payslipData.year,
                staff: payslipData.staffId,
                institution: req.user.institution,
            });
            if (existingPayslip) {
                return res.status(400).json({
                    success: false,
                    error: "Payslip already exists for this staff member in the specified month and year",
                });
            }
        }
        const payslip = new models_1.Payslip({
            ...payslipData,
            staff: payslipData.staffId,
            institution: req.user.institution,
        });
        await payslip.save();
        return res.status(201).json({
            success: true,
            data: payslip,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error('Create payslip error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await models_1.Payslip.findById(id)
            .populate("staff", "id name email department")
            .populate("user", "id name email")
            .lean();
        if (!payslip) {
            return res.status(404).json({
                success: false,
                error: "Payslip not found",
            });
        }
        if (req.user.role === "STAFF" &&
            payslip.user?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        if (req.user.role === "INSTITUTION_ADMIN" &&
            payslip.institution?.toString() !== req.user.institution?.toString()) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        return res.json({
            success: true,
            data: payslip,
        });
    }
    catch (error) {
        console.error("Get payslip error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.put('/:id', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = createPayslipSchema.partial().parse(req.body);
        const existingPayslip = await models_1.Payslip.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!existingPayslip) {
            return res.status(404).json({
                success: false,
                error: "Payslip not found",
            });
        }
        if (updateData.month || updateData.year || updateData.staffId) {
            const month = updateData.month || existingPayslip.month;
            const year = updateData.year || existingPayslip.year;
            const staff = updateData.staffId || existingPayslip.staff;
            const duplicatePayslip = await models_1.Payslip.findOne({
                month,
                year,
                staff,
                institution: req.user.institution,
                _id: { $ne: id },
            });
            if (duplicatePayslip) {
                return res.status(400).json({
                    success: false,
                    error: "Payslip already exists for this staff member in the specified month and year",
                });
            }
        }
        const payslip = await models_1.Payslip.findByIdAndUpdate(id, {
            ...updateData,
            staff: updateData.staffId || existingPayslip.staff,
        }, { new: true, runValidators: true }).lean();
        return res.json({
            success: true,
            data: payslip,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || "Validation error",
            });
        }
        console.error('Update payslip error:', error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.delete("/:id", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await models_1.Payslip.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!payslip) {
            return res.status(404).json({
                success: false,
                error: "Payslip not found",
            });
        }
        await models_1.Payslip.findByIdAndDelete(id);
        return res.json({
            success: true,
            message: "Payslip deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete payslip error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/:id/upload", auth_1.authenticate, auth_1.requireInstitution, upload.single("file"), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }
        const payslip = await models_1.Payslip.findOne({
            _id: id,
            institution: req.user.institution,
        });
        if (!payslip) {
            return res.status(404).json({
                success: false,
                error: "Payslip not found",
            });
        }
        payslip.filePath = req.file.path;
        payslip.fileName = req.file.originalname;
        payslip.status = models_1.PayslipStatus.AVAILABLE;
        payslip.processedAt = new Date();
        await payslip.save();
        return res.json({
            success: true,
            data: payslip,
        });
    }
    catch (error) {
        console.error("Upload payslip error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/staff/:staffId", auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { staffId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const staff = await models_1.Staff.findOne({
            _id: staffId,
            institution: req.user.institution,
        });
        if (!staff) {
            return res.status(404).json({
                success: false,
                error: "Staff member not found",
            });
        }
        const [payslips, total] = await Promise.all([
            models_1.Payslip.find({
                staff: staffId,
                institution: req.user.institution,
            })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            models_1.Payslip.countDocuments({
                staff: staffId,
                institution: req.user.institution,
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return res.json({
            success: true,
            data: {
                payslips,
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
        console.error("Get staff payslips error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=payslips.js.map