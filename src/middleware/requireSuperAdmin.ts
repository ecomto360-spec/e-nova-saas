import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_in_dev_only";

export interface AdminAuthRequest extends Request {
  admin?: {
    admin_id: string;
    role: string;
  };
}

export const requireSuperAdmin = (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.admin_jwt;
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ error: "Forbidden: Super Admin access required" });
    }

    req.admin = {
      admin_id: decoded.admin_id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
