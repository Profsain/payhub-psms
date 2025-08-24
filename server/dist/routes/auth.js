"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const signupSchema = zod_1.z
    .object({
    institutionName: zod_1.z
        .string()
        .min(2, "Institution name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z
        .string()
        .min(10, "Phone number must be at least 10 characters"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
const changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z
        .string()
        .min(8, "New password must be at least 8 characters"),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn });
};
router.post("/login", async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await models_1.User.findOne({ email })
            .populate("institution", "id name email")
            .exec();
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        user.lastLoginAt = new Date();
        await user.save();
        const token = generateToken(user.id);
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        return res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post("/signup", async (req, res) => {
    try {
        const { institutionName, email, phoneNumber, password } = signupSchema.parse(req.body);
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "User with this email already exists",
            });
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const institution = new models_1.Institution({
            name: institutionName,
            email,
            phoneNumber,
        });
        await institution.save();
        const user = new models_1.User({
            email,
            password: hashedPassword,
            name: institutionName,
            role: models_1.UserRole.INSTITUTION_ADMIN,
            phoneNumber,
            institution: institution._id,
        });
        await user.save();
        await user.populate("institution", "id name email");
        const token = generateToken(user.id);
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        return res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post("/change-password", auth_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
        }
        const user = await models_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: "Current password is incorrect",
            });
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, salt);
        user.password = hashedNewPassword;
        await user.save();
        return res.json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
        }
        const user = await models_1.User.findById(req.user.id)
            .populate("institution", "id name email")
            .exec();
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        return res.json({
            success: true,
            data: userWithoutPassword,
        });
    }
    catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/logout", auth_1.authenticate, (req, res) => {
    return res.json({
        success: true,
        message: "Logged out successfully",
    });
});
router.post("/super-admin", async (req, res) => {
    try {
        console.log('Super admin creation request body:', req.body);
        const { email, password, name } = zod_1.z.object({
            email: zod_1.z.string().email("Invalid email address"),
            password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
            name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
        }).parse(req.body);
        console.log('Parsed data:', { email, password: password ? '[HIDDEN]' : 'undefined', name });
        const existingSuperAdmin = await models_1.User.findOne({ role: models_1.UserRole.SUPER_ADMIN });
        if (existingSuperAdmin) {
            return res.status(403).json({
                success: false,
                error: "Super admin already exists. Cannot create another one.",
            });
        }
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "User with this email already exists",
            });
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const superAdmin = new models_1.User({
            email,
            password: hashedPassword,
            name,
            role: models_1.UserRole.SUPER_ADMIN,
            isActive: true,
        });
        await superAdmin.save();
        const token = generateToken(superAdmin.id);
        const userWithoutPassword = superAdmin.toObject();
        delete userWithoutPassword.password;
        console.log('Super admin created successfully:', { email, name, role: models_1.UserRole.SUPER_ADMIN });
        return res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        console.error('Super admin creation error:', error);
        if (error instanceof zod_1.z.ZodError) {
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
exports.default = router;
//# sourceMappingURL=auth.js.map