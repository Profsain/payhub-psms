import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { z } from 'zod';
import { createReadStream } from 'fs';
import { prisma } from '../index';
import { authenticate, authorize, requireInstitution, AuthRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Validation schemas
const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().positive('Salary must be positive').optional(),
  joinedDate: z.string().datetime().optional()
});

const updateStaffSchema = createStaffSchema.partial();

// @route   GET /api/staff
// @desc    Get all staff for institution
// @access  Private (Institution Admin)
router.get('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const department = req.query.department as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      institutionId: req.user!.institutionId
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.isActive = status === 'active';
    }

    // Get staff with pagination
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.staff.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
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
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/staff
// @desc    Create new staff member
// @access  Private (Institution Admin)
router.post('/', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const staffData = createStaffSchema.parse(req.body);

    // Check if staff with same email exists in institution
    const existingStaff = await prisma.staff.findFirst({
      where: {
        email: staffData.email,
        institutionId: req.user!.institutionId
      }
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        error: 'Staff member with this email already exists'
      });
    }

    const staff = await prisma.staff.create({
      data: {
        ...staffData,
        institutionId: req.user!.institutionId,
        joinedDate: staffData.joinedDate ? new Date(staffData.joinedDate) : undefined
      }
    });

    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/staff/:id
// @desc    Get staff member by ID
// @access  Private (Institution Admin)
router.get('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      },
      include: {
        payslips: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/staff/:id
// @desc    Update staff member
// @access  Private (Institution Admin)
router.put('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateStaffSchema.parse(req.body);

    // Check if staff exists and belongs to institution
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Check if email is being changed and if it conflicts
    if (updateData.email && updateData.email !== existingStaff.email) {
      const emailConflict = await prisma.staff.findFirst({
        where: {
          email: updateData.email,
          institutionId: req.user!.institutionId,
          id: { not: id }
        }
      });

      if (emailConflict) {
        return res.status(400).json({
          success: false,
          error: 'Staff member with this email already exists'
        });
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...updateData,
        joinedDate: updateData.joinedDate ? new Date(updateData.joinedDate) : undefined
      }
    });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/staff/:id
// @desc    Delete staff member
// @access  Private (Institution Admin)
router.delete('/:id', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists and belongs to institution
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        institutionId: req.user!.institutionId
      }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.staff.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/staff/upload-csv
// @desc    Upload staff CSV file
// @access  Private (Institution Admin)
router.post('/upload-csv', authenticate, requireInstitution, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const results: any[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      createReadStream(req.file!.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each row
    for (const row of results) {
      try {
        // Validate required fields
        if (!row.name || !row.email) {
          errors.push(`Row ${results.indexOf(row) + 1}: Name and email are required`);
          errorCount++;
          continue;
        }

        // Check if staff already exists
        const existingStaff = await prisma.staff.findFirst({
          where: {
            email: row.email,
            institutionId: req.user!.institutionId
          }
        });

        if (existingStaff) {
          errors.push(`Row ${results.indexOf(row) + 1}: Staff with email ${row.email} already exists`);
          errorCount++;
          continue;
        }

        // Create staff member
        await prisma.staff.create({
          data: {
            name: row.name,
            email: row.email,
            employeeId: row.employeeId || null,
            department: row.department || null,
            position: row.position || null,
            salary: row.salary ? parseFloat(row.salary) : null,
            joinedDate: row.joinedDate ? new Date(row.joinedDate) : null,
            institutionId: req.user!.institutionId
          }
        });

        successCount++;
      } catch (error) {
        errors.push(`Row ${results.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalProcessed: results.length,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Upload CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/staff/departments
// @desc    Get unique departments for institution
// @access  Private (Institution Admin)
router.get('/departments', authenticate, requireInstitution, async (req: AuthRequest, res) => {
  try {
    const departments = await prisma.staff.findMany({
      where: {
        institutionId: req.user!.institutionId,
        department: { not: null }
      },
      select: {
        department: true
      },
      distinct: ['department']
    });

    const departmentList = departments
      .map(d => d.department)
      .filter(Boolean)
      .sort();

    res.json({
      success: true,
      data: departmentList
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 