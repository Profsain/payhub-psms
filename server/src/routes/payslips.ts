import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireInstitution, AuthRequest } from '../middleware/auth';
import { PayslipStatus } from '@prisma/client';

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

    // Build where clause
    const where: any = {};

    if (req.user!.role === 'STAFF') {
      // Staff can only see their own payslips
      where.userId = req.user!.id;
    } else {
      // Institution admin can see all payslips for their institution
      where.institutionId = req.user!.institutionId;
    }

    if (month) {
      where.month = month;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    // Get payslips with pagination
    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          }
        }
      }),
      prisma.payslip.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        payslips,
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
    console.error('Get payslips error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/payslips
// @desc    Create payslip manually
// @access  Private (Institution Admin)
router.post('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const payslipData = createPayslipSchema.parse(req.body);

    // Check if payslip already exists for the same staff and month/year
    if (payslipData.staffId) {
      const existingPayslip = await prisma.payslip.findFirst({
        where: {
          staffId: payslipData.staffId,
          month: payslipData.month,
          year: payslipData.year,
          institutionId: req.user!.institutionId
        }
      });

      if (existingPayslip) {
        return res.status(400).json({
          success: false,
          error: 'Payslip already exists for this staff member and period'
        });
      }
    }

    const payslip = await prisma.payslip.create({
      data: {
        ...payslipData,
        institutionId: req.user!.institutionId,
        status: PayslipStatus.AVAILABLE,
        processedAt: new Date()
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: payslip
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Create payslip error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/payslips/:id
// @desc    Get payslip by ID
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Build where clause
    const where: any = { id };

    if (req.user!.role === 'STAFF') {
      // Staff can only see their own payslips
      where.userId = req.user!.id;
    } else {
      // Institution admin can see payslips for their institution
      where.institutionId = req.user!.institutionId;
    }

    const payslip = await prisma.payslip.findFirst({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true
          }
        }
      }
    });

    if (!payslip) {
      return res.status(404).json({
        success: false,
        error: 'Payslip not found'
      });
    }

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    console.error('Get payslip by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/payslips/upload-pdf
// @desc    Upload bulk payslip PDF
// @access  Private (Institution Admin)
router.post('/upload-pdf', authenticate, requireInstitution, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Create payslip record for the uploaded file
    const payslip = await prisma.payslip.create({
      data: {
        month: req.body.month || 'Unknown',
        year: parseInt(req.body.year) || new Date().getFullYear(),
        grossPay: 0, // Will be updated after processing
        netPay: 0, // Will be updated after processing
        status: PayslipStatus.PROCESSING,
        fileName: req.file.originalname,
        filePath: req.file.path,
        institutionId: req.user!.institutionId
      }
    });

    // In a real application, you would process the PDF here
    // For now, we'll simulate processing
    setTimeout(async () => {
      try {
        await prisma.payslip.update({
          where: { id: payslip.id },
          data: {
            status: PayslipStatus.AVAILABLE,
            processedAt: new Date(),
            grossPay: 450000, // Mock data
            netPay: 380000 // Mock data
          }
        });
      } catch (error) {
        console.error('Error updating payslip after processing:', error);
        await prisma.payslip.update({
          where: { id: payslip.id },
          data: {
            status: PayslipStatus.FAILED
          }
        });
      }
    }, 5000); // Simulate 5-second processing time

    res.json({
      success: true,
      data: {
        payslipId: payslip.id,
        message: 'PDF uploaded successfully. Processing in progress...'
      }
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
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
    const existingPayslip = await prisma.payslip.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      }
    });

    if (!existingPayslip) {
      return res.status(404).json({
        success: false,
        error: 'Payslip not found'
      });
    }

    const payslip = await prisma.payslip.update({
      where: { id },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Update payslip error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/payslips/:id
// @desc    Delete payslip
// @access  Private (Institution Admin)
router.delete('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if payslip exists and belongs to institution
    const existingPayslip = await prisma.payslip.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      }
    });

    if (!existingPayslip) {
      return res.status(404).json({
        success: false,
        error: 'Payslip not found'
      });
    }

    await prisma.payslip.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Payslip deleted successfully'
    });
  } catch (error) {
    console.error('Delete payslip error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/payslips/stats
// @desc    Get payslip statistics
// @access  Private
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    if (req.user!.role === 'STAFF') {
      where.userId = req.user!.id;
    } else {
      where.institutionId = req.user!.institutionId;
    }

    const [totalPayslips, availablePayslips, processingPayslips, totalGrossPay, totalNetPay] = await Promise.all([
      prisma.payslip.count({ where }),
      prisma.payslip.count({ where: { ...where, status: PayslipStatus.AVAILABLE } }),
      prisma.payslip.count({ where: { ...where, status: PayslipStatus.PROCESSING } }),
      prisma.payslip.aggregate({
        where: { ...where, status: PayslipStatus.AVAILABLE },
        _sum: { grossPay: true }
      }),
      prisma.payslip.aggregate({
        where: { ...where, status: PayslipStatus.AVAILABLE },
        _sum: { netPay: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPayslips,
        availablePayslips,
        processingPayslips,
        totalGrossPay: totalGrossPay._sum.grossPay || 0,
        totalNetPay: totalNetPay._sum.netPay || 0
      }
    });
  } catch (error) {
    console.error('Get payslip stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 