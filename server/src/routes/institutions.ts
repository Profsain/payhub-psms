import express from 'express';
import { z } from 'zod';
import {
	Institution,
	User,
	Staff,
	Payslip,
	Subscription,
	UserRole,
} from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Validation schemas
const updateInstitutionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid website URL').optional()
});

// @route   GET /api/institutions
// @desc    Get all institutions (Super Admin only)
// @access  Private (Super Admin)
router.get('/', authenticate, authorize(UserRole.SUPER_ADMIN), async (req: AuthRequest, res) => {
  try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const search = req.query.search as string;

		const skip = (page - 1) * limit;

		// Build search query
		const searchQuery: any = {};
		if (search) {
			searchQuery.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
			];
		}

		// Get institutions with pagination
		const [institutions, total] = await Promise.all([
			Institution.find(searchQuery)
				.skip(skip)
				.limit(limit)
				.sort({ createdAt: -1 })
				.lean(),
			Institution.countDocuments(searchQuery),
		]);

		// Get counts for each institution
		const institutionsWithCounts = await Promise.all(
			institutions.map(async (institution) => {
				const [userCount, staffCount, payslipCount] = await Promise.all(
					[
						User.countDocuments({ institution: institution._id }),
						Staff.countDocuments({ institution: institution._id }),
						Payslip.countDocuments({
							institution: institution._id,
						}),
					],
				);

				return {
					...institution,
					_count: {
						users: userCount,
						staff: staffCount,
						payslips: payslipCount,
					},
				};
			}),
		);

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
  } catch (error) {
    console.error('Get institutions error:', error);
    return res.status(500).json({
		success: false,
		error: "Server error",
	});
  }
});

// @route   GET /api/institutions/:id
// @desc    Get institution by ID
// @access  Private (Super Admin or Institution Admin)
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
	try {
		const { id } = req.params;

		// Check if user has access to this institution
		if (
			req.user!.role === UserRole.INSTITUTION_ADMIN &&
			req.user!.institution?.toString() !== id
		) {
			return res.status(403).json({
				success: false,
				error: "Access denied",
			});
		}

		const institution = await Institution.findById(id).lean();

		if (!institution) {
			return res.status(404).json({
				success: false,
				error: "Institution not found",
			});
		}

		// Get counts
		const [userCount, staffCount, payslipCount, subscriptionCount] =
			await Promise.all([
				User.countDocuments({ institution: id }),
				Staff.countDocuments({ institution: id }),
				Payslip.countDocuments({ institution: id }),
				Subscription.countDocuments({ institution: id }),
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
	} catch (error) {
		console.error("Get institution error:", error);
		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
});

// @route   PUT /api/institutions/:id
// @desc    Update institution
// @access  Private (Super Admin or Institution Admin)
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
	try {
		const { id } = req.params;
		const updateData = updateInstitutionSchema.parse(req.body);

		// Check if user has access to this institution
		if (
			req.user!.role === UserRole.INSTITUTION_ADMIN &&
			req.user!.institution?.toString() !== id
		) {
			return res.status(403).json({
				success: false,
				error: "Access denied",
			});
		}

		const institution = await Institution.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true },
		).lean();

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
	} catch (error) {
		if (error instanceof z.ZodError) {
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

// @route   DELETE /api/institutions/:id
// @desc    Delete institution (Super Admin only)
// @access  Private (Super Admin)
router.delete(
	"/:id",
	authenticate,
	authorize(UserRole.SUPER_ADMIN),
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			// Check if institution exists
			const institution = await Institution.findById(id);

			if (!institution) {
				return res.status(404).json({
					success: false,
					error: "Institution not found",
				});
			}

			// Soft delete by setting isActive to false
			institution.isActive = false;
			await institution.save();

			return res.json({
				success: true,
				message: "Institution deactivated successfully",
			});
		} catch (error) {
			console.error("Delete institution error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

export default router; 