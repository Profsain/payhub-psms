import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, Institution, UserRole } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

const signupSchema = z
	.object({
		institutionName: z
			.string()
			.min(2, "Institution name must be at least 2 characters"),
		email: z.string().email("Invalid email address"),
		phoneNumber: z
			.string()
			.min(10, "Phone number must be at least 10 characters"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().optional(),
	})
	.refine(
		(data) => {
			// Only validate if confirmPassword was provided.
			return data.confirmPassword ? data.password === data.confirmPassword : true;
		},
		{ message: "Passwords don't match", path: ["confirmPassword"] },
	);

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

// Generate JWT token
const generateToken = (userId: string): string => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not defined");
	}

	const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

	// Use any to bypass type checking issues with JWT library
	return (jwt as any).sign({ id: userId }, secret, { expiresIn });
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
	try {
		const { email, password } = loginSchema.parse(req.body);

		// Check if user exists
		const user = await User.findOne({ email })
			.populate("institution", "id name email")
			.exec();

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				error: "Invalid credentials",
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				error: "Invalid credentials",
			});
		}

		// Update last login
		user.lastLoginAt = new Date();
		await user.save();

		// Generate token
		const token = generateToken(user.id);

		// Remove password from response
		const userWithoutPassword = user.toObject();
		delete (userWithoutPassword as any).password;

		return res.json({
			success: true,
			data: {
				user: userWithoutPassword,
				token,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: error.errors[0]?.message || "Validation error",
			});
		}

		console.error("Login error:", error);
		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
});

// @route   POST /api/auth/signup
// @desc    Register institution
// @access  Public
router.post("/signup", async (req, res) => {
	try {
		const { institutionName, email, phoneNumber, password } =
			signupSchema.parse(req.body);

		// Check if user already exists
		const existingUser = await User.findOne({ email });

		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: "User with this email already exists",
			});
		}

		// Hash password
		const salt = await bcrypt.genSalt(12);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create institution and user
		const institution = new Institution({
			name: institutionName,
			email,
			phoneNumber,
		});

		await institution.save();

		const user = new User({
			email,
			password: hashedPassword,
			name: institutionName,
			role: UserRole.INSTITUTION_ADMIN,
			phoneNumber,
			institution: institution._id,
			isActive: true,
		});

		await user.save();

		// Populate institution data
		await user.populate("institution", "id name email");

		// Generate token
		const token = generateToken(user.id);

		// Remove password from response
		const userWithoutPassword = user.toObject();
		delete (userWithoutPassword as any).password;

		return res.status(201).json({
			success: true,
			data: {
				user: userWithoutPassword,
				token,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: error.errors[0]?.message || "Validation error",
			});
		}

		console.error("Signup error:", error);
		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post("/change-password", authenticate, async (req: AuthRequest, res) => {
	try {
		const { currentPassword, newPassword } = changePasswordSchema.parse(
			req.body,
		);

		if (!req.user) {
			return res.status(401).json({
				success: false,
				error: "Not authenticated",
			});
		}

		// Get user with password
		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password,
		);
		if (!isCurrentPasswordValid) {
			return res.status(400).json({
				success: false,
				error: "Current password is incorrect",
			});
		}

		// Hash new password
		const salt = await bcrypt.genSalt(12);
		const hashedNewPassword = await bcrypt.hash(newPassword, salt);

		// Update password
		user.password = hashedNewPassword;
		await user.save();

		return res.json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: error.errors[0]?.message || "Validation error",
			});
		}

		console.error("Change password error:", error);
		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticate, async (req: AuthRequest, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				error: "Not authenticated",
			});
		}

		const user = await User.findById(req.user.id)
			.populate("institution", "id name email")
			.exec();

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Remove password from response
		const userWithoutPassword = user.toObject();
		delete (userWithoutPassword as any).password;

		return res.json({
			success: true,
			data: userWithoutPassword,
		});
	} catch (error) {
		console.error("Get user error:", error);
		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", authenticate, (req: AuthRequest, res) => {
	return res.json({
		success: true,
		message: "Logged out successfully",
	});
});

// @route   POST /api/auth/super-admin
// @desc    Create super admin (first time setup)
// @access  Public (only for initial setup)
router.post("/super-admin", async (req, res) => {
	try {
		const { email, password, name } = z.object({
			email: z.string().email("Invalid email address"),
			password: z.string().min(8, "Password must be at least 8 characters"),
			name: z.string().min(2, "Name must be at least 2 characters"),
		}).parse(req.body);

		// Check if any super admin already exists
		const existingSuperAdmin = await User.findOne({ role: UserRole.SUPER_ADMIN });
		if (existingSuperAdmin) {
			return res.status(403).json({
				success: false,
				error: "Super admin already exists. Cannot create another one.",
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: "User with this email already exists",
			});
		}

		// Hash password
		const salt = await bcrypt.genSalt(12);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create super admin user
		const superAdmin = new User({
			email,
			password: hashedPassword,
			name,
			role: UserRole.SUPER_ADMIN,
			isActive: true,
		});

		await superAdmin.save();

		// Generate token
		const token = generateToken(superAdmin.id);

		// Remove password from response
		const userWithoutPassword = superAdmin.toObject();
		delete (userWithoutPassword as any).password;

		return res.status(201).json({
			success: true,
			data: {
				user: userWithoutPassword,
				token,
			},
		});
	} catch (error) {
		console.error('Super admin creation error:', error);
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: error.errors[0]?.message || "Validation error",
			});
		}

		return res.status(500).json({
			success: false,
			error: "Server error",
		});
	}
});

export default router; 