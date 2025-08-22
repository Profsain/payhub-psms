import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Payslip, Staff, PayslipStatus } from "../models";
import {
	authenticate,
	requireInstitution,
	AuthRequest,
} from "../middleware/auth";

const router = express.Router();

// Multer configuration for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payslip-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Validation schemas
const createPayslipSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  year: z.number().int().min(2020, 'Year must be 2020 or later'),
  grossPay: z.number().positive('Gross pay must be positive'),
  netPay: z.number().positive('Net pay must be positive'),
  deductions: z.number().optional(),
  allowances: z.number().optional(),
  staffId: z.string().optional()
});

// @route   GET /api/payslips
// @desc    Get payslips for institution or user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const month = req.query.month as string;
		const year = req.query.year as string;
		const status = req.query.status as string;

		const skip = (page - 1) * limit;

		// Build search query
		const searchQuery: any = {};

		if (req.user!.role === "STAFF") {
			// Staff can only see their own payslips
			searchQuery.user = req.user!.id;
		} else {
			// Institution admin can see all payslips for their institution
			searchQuery.institution = req.user!.institution;
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

		// Get payslips with pagination
		const [payslips, total] = await Promise.all([
			Payslip.find(searchQuery)
				.skip(skip)
				.limit(limit)
				.sort({ createdAt: -1 })
				.populate("staff", "id name email department")
				.lean(),
			Payslip.countDocuments(searchQuery),
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
  } catch (error) {
    console.error('Get payslips error:', error);
    return res.status(500).json({
		success: false,
		error: "Server error",
	});
  }
});

// @route   POST /api/payslips
// @desc    Create new payslip
// @access  Private (Institution Admin)
router.post('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
		const payslipData = createPayslipSchema.parse(req.body);

		// Check if payslip already exists for the same month, year, and staff
		if (payslipData.staffId) {
			const existingPayslip = await Payslip.findOne({
				month: payslipData.month,
				year: payslipData.year,
				staff: payslipData.staffId,
				institution: req.user!.institution,
			});

			if (existingPayslip) {
				return res.status(400).json({
					success: false,
					error: "Payslip already exists for this staff member in the specified month and year",
				});
			}
		}

		const payslip = new Payslip({
			...payslipData,
			staff: payslipData.staffId,
			institution: req.user!.institution,
		});

		await payslip.save();

		return res.status(201).json({
			success: true,
			data: payslip,
		});
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// @route   GET /api/payslips/:id
// @desc    Get payslip by ID
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const payslip = await Payslip.findById(id)
		.populate("staff", "id name email department")
		.populate("user", "id name email")
		.lean();

	if (!payslip) {
		return res.status(404).json({
			success: false,
			error: "Payslip not found",
		});
	}

	// Check access control
	if (
		req.user!.role === "STAFF" &&
		payslip.user?.toString() !== req.user!.id
	) {
		return res.status(403).json({
			success: false,
			error: "Access denied",
		});
	}

    if (
		req.user!.role === "INSTITUTION_ADMIN" &&
		payslip.institution?.toString() !== req.user!.institution?.toString()
	) {
		return res.status(403).json({
			success: false,
			error: "Access denied",
		});
	}

    return res.json({
		success: true,
		data: payslip,
	});
  } catch (error) {
    console.error("Get payslip error:", error);
	return res.status(500).json({
		success: false,
		error: "Server error",
	});
  }
});

// @route   PUT /api/payslips/:id
// @desc    Update payslip
// @access  Private (Institution Admin)
router.put('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = createPayslipSchema.partial().parse(req.body);

    // Check if payslip exists and belongs to institution
    const existingPayslip = await Payslip.findOne({
		_id: id,
		institution: req.user!.institution,
	});

	if (!existingPayslip) {
		return res.status(404).json({
			success: false,
			error: "Payslip not found",
		});
	}

	// Check if update would create duplicate
	if (updateData.month || updateData.year || updateData.staffId) {
		const month = updateData.month || existingPayslip.month;
		const year = updateData.year || existingPayslip.year;
		const staff = updateData.staffId || existingPayslip.staff;

		const duplicatePayslip = await Payslip.findOne({
			month,
			year,
			staff,
			institution: req.user!.institution,
			_id: { $ne: id },
		});

		if (duplicatePayslip) {
			return res.status(400).json({
				success: false,
				error: "Payslip already exists for this staff member in the specified month and year",
			});
		}
	}

    const payslip = await Payslip.findByIdAndUpdate(
		id,
		{
			...updateData,
			staff: updateData.staffId || existingPayslip.staff,
		},
		{ new: true, runValidators: true },
	).lean();

    return res.json({
		success: true,
		data: payslip,
	});
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// @route   DELETE /api/payslips/:id
// @desc    Delete payslip
// @access  Private (Institution Admin)
router.delete(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			// Check if payslip exists and belongs to institution
			const payslip = await Payslip.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!payslip) {
				return res.status(404).json({
					success: false,
					error: "Payslip not found",
				});
			}

			await Payslip.findByIdAndDelete(id);

			return res.json({
				success: true,
				message: "Payslip deleted successfully",
			});
		} catch (error) {
			console.error("Delete payslip error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   POST /api/payslips/:id/upload
// @desc    Upload payslip PDF file
// @access  Private (Institution Admin)
router.post(
	"/:id/upload",
	authenticate,
	requireInstitution,
	upload.single("file"),
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			if (!req.file) {
				return res.status(400).json({
					success: false,
					error: "No file uploaded",
				});
			}

			// Check if payslip exists and belongs to institution
			const payslip = await Payslip.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!payslip) {
				return res.status(404).json({
					success: false,
					error: "Payslip not found",
				});
			}

			// Update payslip with file information
			payslip.filePath = req.file.path;
			payslip.fileName = req.file.originalname;
			payslip.status = PayslipStatus.AVAILABLE;
			payslip.processedAt = new Date();

			await payslip.save();

			return res.json({
				success: true,
				data: payslip,
			});
		} catch (error) {
			console.error("Upload payslip error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   GET /api/payslips/staff/:staffId
// @desc    Get payslips for specific staff member
// @access  Private (Institution Admin)
router.get(
	"/staff/:staffId",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { staffId } = req.params;
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;

			const skip = (page - 1) * limit;

			// Check if staff belongs to institution
			const staff = await Staff.findOne({
				_id: staffId,
				institution: req.user!.institution,
			});

			if (!staff) {
				return res.status(404).json({
					success: false,
					error: "Staff member not found",
				});
			}

			// Get payslips for staff member
			const [payslips, total] = await Promise.all([
				Payslip.find({
					staff: staffId,
					institution: req.user!.institution,
				})
					.skip(skip)
					.limit(limit)
					.sort({ createdAt: -1 })
					.lean(),
				Payslip.countDocuments({
					staff: staffId,
					institution: req.user!.institution,
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
		} catch (error) {
			console.error("Get staff payslips error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

export default router; 