import { Request, Response, NextFunction } from "express";
import { Course } from "../models/courseModel";
import { CourseCreateSchema, CourseUpdateSchema } from "../validations/course";
import { uploadFileToS3, deleteS3Object, deleteS3Folder } from "../utils/s3";

// CREATE COURSE
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  const parse = CourseCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }
  try {
    let imageKey: string | undefined;
    if (req.file) {
      imageKey = await uploadFileToS3(req.file);
    }
    const course = new Course({
      ...parse.data,
      image: imageKey,
    });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

// UPDATE COURSE
export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  const parse = CourseUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }
  try {
    let updateData = { ...parse.data };
    if (req.file) {
      updateData.image = await uploadFileToS3(req.file);
    }
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// GET ALL COURSES
export const getAllCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

// GET SINGLE COURSE
export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// DELETE COURSE (delete image and all video assets from S3 first)
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return;
    }

    // Delete course image from S3
    if (course.image) {
      await deleteS3Object(course.image);
    }

    // Delete all video folders for video sections
    for (const section of course.sections) {
      if (section.type === "Video" && section.content) {
        const videoFolder = section.content.split("/master.m3u8")[0] + "/";
        await deleteS3Folder(videoFolder);
      }
    }

    await course.deleteOne();
    res.json({ message: "Course and associated files deleted" });
  } catch (err) {
    next(err);
  }
};
