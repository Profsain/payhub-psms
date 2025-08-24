"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const zod_1 = require("zod");
const fs_1 = require("fs");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_PATH || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});
const createStaffSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    employeeId: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    salary: zod_1.z.number().positive('Salary must be positive').optional(),
    joinedDate: zod_1.z.string().datetime().optional()
});
const updateStaffSchema = createStaffSchema.partial();
router.get('/', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const department = req.query.department;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const searchQuery = {
            institution: req.user.institution
        };
        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }
        if (department) {
            searchQuery.department = department;
        }
        if (status) {
            searchQuery.isActive = status === 'active';
        }
        const [staff, total] = await Promise.all([
            models_1.Staff.find(searchQuery)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            models_1.Staff.countDocuments(searchQuery)
        ]);
        const totalPages = Math.ceil(total / limit);
        return res.json({
            success: true,
            data: {
                staff,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Get staff error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
router.post('/', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const staffData = createStaffSchema.parse(req.body);
        const existingStaff = await models_1.Staff.findOne({
            email: staffData.email,
            institution: req.user.institution
        });
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                error: 'Staff member with this email already exists'
            });
        }
        const staff = new models_1.Staff({
            ...staffData,
            institution: req.user.institution,
            joinedDate: staffData.joinedDate ? new Date(staffData.joinedDate) : undefined
        });
        await staff.save();
        return res.status(201).json({
            success: true,
            data: staff
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || 'Validation error'
            });
        }
        console.error('Create staff error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
router.get('/:id', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await models_1.Staff.findOne({
            _id: id,
            institution: req.user.institution
        }).lean();
        if (!staff) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found'
            });
        }
        const payslips = await models_1.Payslip.find({
            staff: id
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        const staffWithPayslips = {
            ...staff,
            payslips
        };
        return res.json({
            success: true,
            data: staffWithPayslips
        });
    }
    catch (error) {
        console.error('Get staff by ID error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
router.put('/:id', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = updateStaffSchema.parse(req.body);
        const existingStaff = await models_1.Staff.findOne({
            _id: id,
            institution: req.user.institution
        });
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found'
            });
        }
        if (updateData.email && updateData.email !== existingStaff.email) {
            const emailConflict = await models_1.Staff.findOne({
                email: updateData.email,
                institution: req.user.institution,
                _id: { $ne: id }
            });
            if (emailConflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Staff member with this email already exists'
                });
            }
        }
        const staff = await models_1.Staff.findByIdAndUpdate(id, {
            ...updateData,
            joinedDate: updateData.joinedDate ? new Date(updateData.joinedDate) : undefined
        }, { new: true, runValidators: true }).lean();
        return res.json({
            success: true,
            data: staff
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0]?.message || 'Validation error'
            });
        }
        console.error('Update staff error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
router.delete('/:id', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const { id } = req.params;
        const existingStaff = await models_1.Staff.findOne({
            _id: id,
            institution: req.user.institution
        });
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                error: 'Staff member not found'
            });
        }
        existingStaff.isActive = false;
        await existingStaff.save();
        return res.json({
            success: true,
            message: 'Staff member deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete staff error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
router.post('/upload-csv', auth_1.authenticate, auth_1.requireInstitution, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const results = [];
        const errors = [];
        let successCount = 0;
        let errorCount = 0;
        await new Promise((resolve, reject) => {
            (0, fs_1.createReadStream)(req.file.path)
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });
        for (const row of results) {
            try {
                if (!row.name || !row.email) {
                    errors.push(`Row ${results.indexOf(row) + 1}: Name and email are required`);
                    errorCount++;
                    continue;
                }
                const existingStaff = await models_1.Staff.findOne({
                    email: row.email,
                    institution: req.user.institution
                });
                if (existingStaff) {
                    errors.push(`Row ${results.indexOf(row) + 1}: Staff with email ${row.email} already exists`);
                    errorCount++;
                    continue;
                }
                const staff = new models_1.Staff({
                    name: row.name,
                    email: row.email,
                    employeeId: row.employeeId || null,
                    department: row.department || null,
                    position: row.position || null,
                    salary: row.salary ? parseFloat(row.salary) : null,
                    joinedDate: row.joinedDate ? new Date(row.joinedDate) : null,
                    institution: req.user.institution
                });
                await staff.save();
                successCount++;
            }
            catch (error) {
                errors.push(`Row ${results.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                errorCount++;
            }
        }
        return res.json({
            success: true,
            data: {
                totalProcessed: results.length,
                successCount,
                errorCount,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    }
    catch (error) {
        console.error('Upload CSV error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
router.get('/departments', auth_1.authenticate, auth_1.requireInstitution, async (req, res) => {
    try {
        const departments = await models_1.Staff.distinct('department', {
            institution: req.user.institution,
            department: { $ne: null }
        });
        const departmentList = departments
            .filter(Boolean)
            .sort();
        return res.json({
            success: true,
            data: departmentList
        });
    }
    catch (error) {
        console.error('Get departments error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=staff.js.map