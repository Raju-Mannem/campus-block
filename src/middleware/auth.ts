import { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await getToken({  
      req,
      secret: NEXTAUTH_SECRET,
      // raw: true, // get the raw JWT if you want to decode manually; omit for auto-decode
    });
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    // Attach user info to req.user for downstream use
    req.user = token as any; // You can type this better if you know your JWT structure

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
};
