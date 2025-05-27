import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { Course } from "../models/courseModel";

// Get current user's profile
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await User.findById(req.user._id).select("-__v");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update current user's profile (name, email)
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updates: Partial<{ name: string; email: string }> = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-__v");
    if (!user) {
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

// List all courses the user is enrolled in
export const getMyCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Populate the coursesEnrolled array
    const user = await User.findById(req.user._id).populate("coursesEnrolled", "-__v");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user.coursesEnrolled);
  } catch (err) {
    next(err);
  }
};
