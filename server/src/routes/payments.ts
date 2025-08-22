import express from 'express';
import { z } from 'zod';
import { Payment, Subscription, PaymentStatus } from "../models";
import {
	authenticate,
	requireInstitution,
	AuthRequest,
} from "../middleware/auth";

const router = express.Router();

// Validation schemas
const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('NGN'),
  description: z.string().optional(),
  subscriptionId: z.string().optional()
});

// @route   GET /api/payments
// @desc    Get payments for institution
// @access  Private (Institution Admin)
router.get(
	"/",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;
			const status = req.query.status as string;

			const skip = (page - 1) * limit;

			// Build search query
			const searchQuery: any = {
				institution: req.user!.institution,
			};

			if (status) {
				searchQuery.status = status;
			}

			// Get payments with pagination
			const [payments, total] = await Promise.all([
				Payment.find(searchQuery)
					.skip(skip)
					.limit(limit)
					.sort({ createdAt: -1 })
					.populate("subscription", "id planName billingCycle")
					.lean(),
				Payment.countDocuments(searchQuery),
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
		} catch (error) {
			console.error("Get payments error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   POST /api/payments
// @desc    Create payment record
// @access  Private (Institution Admin)
router.post(
	"/",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const paymentData = createPaymentSchema.parse(req.body);

			const payment = new Payment({
				...paymentData,
				institution: req.user!.institution,
				status: PaymentStatus.PENDING,
			});

			await payment.save();

			// Populate subscription data
			if (payment.subscription) {
				await payment.populate(
					"subscription",
					"id planName billingCycle",
				);
			}

			return res.status(201).json({
				success: true,
				data: payment,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
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
	},
);

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private (Institution Admin)
router.get(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			const payment = await Payment.findOne({
				_id: id,
				institution: req.user!.institution,
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
		} catch (error) {
			console.error("Get payment error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private (Institution Admin)
router.put(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;
			const updateData = createPaymentSchema.partial().parse(req.body);

			// Check if payment exists and belongs to institution
			const existingPayment = await Payment.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!existingPayment) {
				return res.status(404).json({
					success: false,
					error: "Payment not found",
				});
			}

			const payment = await Payment.findByIdAndUpdate(id, updateData, {
				new: true,
				runValidators: true,
			})
				.populate("subscription", "id planName billingCycle")
				.lean();

			return res.json({
				success: true,
				data: payment,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
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
	},
);

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private (Institution Admin)
router.delete(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			// Check if payment exists and belongs to institution
			const payment = await Payment.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!payment) {
				return res.status(404).json({
					success: false,
					error: "Payment not found",
				});
			}

			await Payment.findByIdAndDelete(id);

			return res.json({
				success: true,
				message: "Payment deleted successfully",
			});
		} catch (error) {
			console.error("Delete payment error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   POST /api/payments/:id/process
// @desc    Process payment (simulate Stripe processing)
// @access  Private (Institution Admin)
router.post('/:id/process', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
		const { id } = req.params;

		// Check if payment exists and belongs to institution
		const payment = await Payment.findOne({
			_id: id,
			institution: req.user!.institution,
		});

		if (!payment) {
			return res.status(404).json({
				success: false,
				error: "Payment not found",
			});
		}

		if (payment.status !== PaymentStatus.PENDING) {
			return res.status(400).json({
				success: false,
				error: "Payment is not pending",
			});
		}

		// Simulate payment processing
		payment.status = PaymentStatus.COMPLETED;
		payment.stripePaymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		await payment.save();

		return res.json({
			success: true,
			data: payment,
			message: "Payment processed successfully",
		});
  } catch (error) {
    console.error('Process payment error:', error);
    return res.status(500).json({
		success: false,
		error: "Server error",
	});
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Refund payment
// @access  Private (Institution Admin)
router.post(
	"/:id/refund",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			// Check if payment exists and belongs to institution
			const payment = await Payment.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!payment) {
				return res.status(404).json({
					success: false,
					error: "Payment not found",
				});
			}

			if (payment.status !== PaymentStatus.COMPLETED) {
				return res.status(400).json({
					success: false,
					error: "Only completed payments can be refunded",
				});
			}

			// Process refund
			payment.status = PaymentStatus.REFUNDED;
			await payment.save();

			return res.json({
				success: true,
				data: payment,
				message: "Payment refunded successfully",
			});
		} catch (error) {
			console.error("Refund payment error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

export default router; 