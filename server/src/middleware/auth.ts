import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from "../models";

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email: string;
		role: UserRole;
		institution?: string;
	};
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Check if user still exists
    const userDoc = await User.findById(decoded.id)
		.select("_id email role institution isActive")
		.lean();

	if (!userDoc || !userDoc.isActive) {
		res.status(401).json({
			success: false,
			error: "User not found or inactive",
		});
		return;
	}

	// Map Mongoose document to expected user interface
	req.user = {
		id: userDoc._id.toString(),
		email: userDoc.email,
		role: userDoc.role,
		institution: userDoc.institution?.toString(),
	};
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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

export const requireInstitution = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.institution) {
		res.status(403).json({
			success: false,
			error: "Access denied. Institution access required.",
		});
		return;
  }

  next();
}; 