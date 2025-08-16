import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';

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

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get institutions with pagination
    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              staff: true,
              payslips: true
            }
          }
        }
      }),
      prisma.institution.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        institutions,
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
    console.error('Get institutions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/institutions/:id
// @desc    Get institution by ID
// @access  Private (Super Admin or Institution Admin)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user has access to this institution
    if (req.user!.role === UserRole.INSTITUTION_ADMIN && req.user!.institutionId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const institution = await prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            staff: true,
            payslips: true,
            subscriptions: true
          }
        }
      }
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
    }

    res.json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/institutions/:id
// @desc    Update institution
// @access  Private (Super Admin or Institution Admin)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateInstitutionSchema.parse(req.body);

    // Check if user has access to this institution
    if (req.user!.role === UserRole.INSTITUTION_ADMIN && req.user!.institutionId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const institution = await prisma.institution.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: institution
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Update institution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/institutions/:id
// @desc    Delete institution (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', authenticate, authorize(UserRole.SUPER_ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id }
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.institution.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Institution deactivated successfully'
    });
  } catch (error) {
    console.error('Delete institution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 