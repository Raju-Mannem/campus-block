import { Request, Response, NextFunction } from "express";
import { CourseProgress } from "../models/progressModel";
import { Course } from "../models/courseModel";
import mongoose from "mongoose";

// Mark a section as completed
export const markSectionCompleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user){
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { courseId } = req.params;
    const { sectionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      res.status(400).json({ error: "Invalid sectionId" });
      return;
    }

    // Check course and section exist
    const course = await Course.findById(courseId);
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return;
    }
    const section = course.sections.id(sectionId);
    if (!section){
      res.status(404).json({ error: "Section not found" });
      return;
    }

    // Calculate progress percent
    const totalSections = course.sections.length;
    // Use $addToSet to avoid duplicates
    const progress = await CourseProgress.findOneAndUpdate(
      { user: req.user._id, course: courseId },
      {
        $addToSet: { completedSections: sectionId },
        $set: { lastAccessedSection: sectionId, updatedAt: new Date() }
      },
      { new: true, upsert: true }
    );

    // Calculate percent and update if changed
    const completedCount = progress.completedSections.length;
    const percent = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

    if (progress.progressPercent !== percent) {
      progress.progressPercent = percent;
      await progress.save();
    }

    res.json(progress);
  } catch (err) {
    next(err);
  }
};

// Get progress for a course
export const getCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user){
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { courseId } = req.params;
    const progress = await CourseProgress.findOne({ user: req.user._id, course: courseId });
    res.json(
      progress || {
        user: req.user._id,
        course: courseId,
        completedSections: [],
        lastAccessedSection: null,
        progressPercent: 0,
        updatedAt: null,
      }
    );
  } catch (err) {
    next(err);
  }
};
