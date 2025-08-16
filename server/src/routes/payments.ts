import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireInstitution, AuthRequest } from '../middleware/auth';
import { PaymentStatus } from '@prisma/client';

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
router.get('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      institutionId: req.user!.institutionId
    };

    if (status) {
      where.status = status;
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              id: true,
              planName: true,
              billingCycle: true
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        payments,
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
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/payments
// @desc    Create payment record
// @access  Private (Institution Admin)
router.post('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const paymentData = createPaymentSchema.parse(req.body);

    const payment = await prisma.payment.create({
      data: {
        ...paymentData,
        institutionId: req.user!.institutionId,
        status: PaymentStatus.PENDING
      },
      include: {
        subscription: {
          select: {
            id: true,
            planName: true,
            billingCycle: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private (Institution Admin)
router.get('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      },
      include: {
        subscription: {
          select: {
            id: true,
            planName: true,
            billingCycle: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/payments/:id/process
// @desc    Process payment (simulate Stripe payment)
// @access  Private (Institution Admin)
router.post('/:id/process', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Payment is not pending'
      });
    }

    // Simulate payment processing
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.COMPLETED,
        stripePaymentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          processedAt: new Date().toISOString(),
          processor: 'stripe'
        }
      }
    });

    // If payment is for a subscription, activate it
    if (payment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          stripeSubscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }

    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/payments/stats
// @desc    Get payment statistics
// @access  Private (Institution Admin)
router.get('/stats', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const where = {
      institutionId: req.user!.institutionId
    };

    const [totalPayments, completedPayments, pendingPayments, totalAmount, completedAmount] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: PaymentStatus.COMPLETED } }),
      prisma.payment.count({ where: { ...where, status: PaymentStatus.PENDING } }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.COMPLETED },
        _sum: { amount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPayments,
        completedPayments,
        pendingPayments,
        totalAmount: totalAmount._sum.amount || 0,
        completedAmount: completedAmount._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 