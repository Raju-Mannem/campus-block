import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";

// Middleware to ensure admin access
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

// List all users (with optional pagination)
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-__v -password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      users,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    next(err);
  }
};

// Get a single user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.userId).select("-__v -password");
    if (!user){
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Edit/update a user (admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Partial<{ name: string; email: string; role: string }> = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.role) updates.role = req.body.role;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).select("-__v -password");

    if (!user){
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err:any) {
    // Handle duplicate email error
    if (err.code === 11000 && err.keyValue?.email) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    next(err);
  }
};

// Delete a user (admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user){
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
