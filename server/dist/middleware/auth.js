"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInstitution = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
            return;
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userDoc = await models_1.User.findById(decoded.id)
            .select("_id email role institution isActive")
            .lean();
        if (!userDoc || !userDoc.isActive) {
            res.status(401).json({
                success: false,
                error: "User not found or inactive",
            });
            return;
        }
        req.user = {
            id: userDoc._id.toString(),
            email: userDoc.email,
            role: userDoc.role,
            institution: userDoc.institution?.toString(),
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Authentication error'
            });
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Access denied. Not authenticated.'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Access denied. Insufficient permissions.'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requireInstitution = (req, res, next) => {
    if (!req.user?.institution) {
        res.status(403).json({
            success: false,
            error: "Access denied. Institution access required.",
        });
        return;
    }
    next();
};
exports.requireInstitution = requireInstitution;
//# sourceMappingURL=auth.js.map