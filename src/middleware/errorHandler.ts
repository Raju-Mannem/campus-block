import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv"

dotenv.config();

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    res.status(500).json({ message: "Internal server error" });
  } else {
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};
