import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireInstitution, AuthRequest } from '../middleware/auth';
import { SubscriptionStatus } from '@prisma/client';

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
    const subscriptions = await prisma.subscription.findMany({
      where: {
        institutionId: req.user!.institutionId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
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
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        institutionId: req.user!.institutionId,
        status: SubscriptionStatus.ACTIVE
      }
    });

    if (activeSubscription) {
      return res.status(400).json({
        success: false,
        error: 'Institution already has an active subscription'
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        ...subscriptionData,
        institutionId: req.user!.institutionId,
        status: SubscriptionStatus.PENDING,
        startDate: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/subscriptions/:id
// @desc    Get subscription by ID
// @access  Private (Institution Admin)
router.get('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/subscriptions/:id/cancel
// @desc    Cancel subscription
// @access  Private (Institution Admin)
router.put('/:id/cancel', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        error: 'Only active subscriptions can be cancelled'
      });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        endDate: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

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