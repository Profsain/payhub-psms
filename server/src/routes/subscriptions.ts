import express from 'express';
import { z } from 'zod';
import { Subscription, Payment, SubscriptionStatus } from "../models";
import {
	authenticate,
	requireInstitution,
	AuthRequest,
} from "../middleware/auth";

const router = express.Router();

// Validation schemas
const createSubscriptionSchema = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  planPrice: z.number().positive('Plan price must be positive'),
  billingCycle: z.enum(['monthly', 'yearly'], {
    errorMap: () => ({ message: 'Billing cycle must be monthly or yearly' })
  })
});

// @route   GET /api/subscriptions
// @desc    Get subscriptions for institution
// @access  Private (Institution Admin)
router.get('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const subscriptions = await Subscription.find({
		institution: req.user!.institution,
	})
		.sort({ createdAt: -1 })
		.lean();

	// Get payments for each subscription
	const subscriptionsWithPayments = await Promise.all(
		subscriptions.map(async (subscription) => {
			const payments = await Payment.find({
				subscription: subscription._id,
			})
				.sort({ createdAt: -1 })
				.limit(5)
				.lean();

			return {
				...subscription,
				payments,
			};
		}),
	);

    return res.json({
		success: true,
		data: subscriptionsWithPayments,
	});
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return res.status(500).json({
		success: false,
		error: "Server error",
	});
  }
});

// @route   POST /api/subscriptions
// @desc    Create new subscription
// @access  Private (Institution Admin)
router.post('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const subscriptionData = createSubscriptionSchema.parse(req.body);

    // Check if institution already has an active subscription
    const activeSubscription = await Subscription.findOne({
		institution: req.user!.institution,
		status: SubscriptionStatus.ACTIVE,
	});

    if (activeSubscription) {
      return res.status(400).json({
        success: false,
        error: 'Institution already has an active subscription'
      });
    }

    const subscription = new Subscription({
		...subscriptionData,
		institution: req.user!.institution,
		status: SubscriptionStatus.PENDING,
		startDate: new Date(),
	});

    await subscription.save();

	return res.status(201).json({
		success: true,
		data: subscription,
	});
  } catch (error) {
    if (error instanceof z.ZodError) {
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

// @route   GET /api/subscriptions/:id
// @desc    Get subscription by ID
// @access  Private (Institution Admin)
router.get(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			const subscription = await Subscription.findOne({
				_id: id,
				institution: req.user!.institution,
			}).lean();

			if (!subscription) {
				return res.status(404).json({
					success: false,
					error: "Subscription not found",
				});
			}

			// Get payments for this subscription
			const payments = await Payment.find({
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
		} catch (error) {
			console.error("Get subscription error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription
// @access  Private (Institution Admin)
router.put(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;
			const updateData = createSubscriptionSchema
				.partial()
				.parse(req.body);

			// Check if subscription exists and belongs to institution
			const existingSubscription = await Subscription.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!existingSubscription) {
				return res.status(404).json({
					success: false,
					error: "Subscription not found",
				});
			}

			const subscription = await Subscription.findByIdAndUpdate(
				id,
				updateData,
				{ new: true, runValidators: true },
			).lean();

			return res.json({
				success: true,
				data: subscription,
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
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
	},
);

// @route   DELETE /api/subscriptions/:id
// @desc    Cancel subscription
// @access  Private (Institution Admin)
router.delete(
	"/:id",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			// Check if subscription exists and belongs to institution
			const subscription = await Subscription.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!subscription) {
				return res.status(404).json({
					success: false,
					error: "Subscription not found",
				});
			}

			// Cancel subscription by setting status to CANCELLED
			subscription.status = SubscriptionStatus.CANCELLED;
			subscription.endDate = new Date();
			await subscription.save();

			return res.json({
				success: true,
				message: "Subscription cancelled successfully",
			});
		} catch (error) {
			console.error("Cancel subscription error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   POST /api/subscriptions/:id/activate
// @desc    Activate subscription
// @access  Private (Institution Admin)
router.post(
	"/:id/activate",
	authenticate,
	requireInstitution,
	async (req: AuthRequest, res) => {
		try {
			const { id } = req.params;

			// Check if subscription exists and belongs to institution
			const subscription = await Subscription.findOne({
				_id: id,
				institution: req.user!.institution,
			});

			if (!subscription) {
				return res.status(404).json({
					success: false,
					error: "Subscription not found",
				});
			}

			// Check if institution already has an active subscription
			if (subscription.status === SubscriptionStatus.ACTIVE) {
				return res.status(400).json({
					success: false,
					error: "Subscription is already active",
				});
			}

			// Deactivate any other active subscriptions
			await Subscription.updateMany(
				{
					institution: req.user!.institution,
					status: SubscriptionStatus.ACTIVE,
				},
				{
					status: SubscriptionStatus.SUSPENDED,
					endDate: new Date(),
				},
			);

			// Activate this subscription
			subscription.status = SubscriptionStatus.ACTIVE;
			subscription.startDate = new Date();
			subscription.endDate = undefined;
			await subscription.save();

			return res.json({
				success: true,
				data: subscription,
			});
		} catch (error) {
			console.error("Activate subscription error:", error);
			return res.status(500).json({
				success: false,
				error: "Server error",
			});
		}
	},
);

// @route   GET /api/subscriptions/plans
// @desc    Get available subscription plans
// @access  Public
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29000, // ₦29,000
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
      price: 79000, // ₦79,000
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
      price: 199000, // ₦199,000
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

export default router; 