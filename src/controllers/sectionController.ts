import { Request, Response, NextFunction } from "express";
import { Course } from "../models/courseModel";
import { CourseProgress } from "../models/progressModel";
import { SectionSchema } from "../validations/section";

// Add a section to a course
export const addSection = async (req: Request, res: Response, next: NextFunction) => {
  const parse = SectionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    };

    // Add new section
    course.sections.push(parse.data);
    await course.save();

    // Return the newly added section (last in array)
    res.status(201).json(course.sections[course.sections.length - 1]);
  } catch (err) {
    next(err);
  }
};

// Update a section in a course
export const updateSection = async (req: Request, res: Response, next: NextFunction) => {
  const parse = SectionSchema.partial().safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return;
    }

    // Use .id() to get the section subdocument
    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      res.status(404).json({ error: "Section not found" });
      return;
    }

    Object.assign(section, parse.data);
    await course.save();

    res.json(section);
  } catch (err) {
    next(err);
  }
};

// // Delete a section from a course
// export const deleteSection = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Efficient and type-safe: Use .pull() on the array and save
//     const course = await Course.findById(req.params.courseId);
//     if (!course) {
//       res.status(404).json({ error: "Course not found" });
//       return;
//     }

//     // Check if section exists before removing
//     const section = course.sections.id(req.params.sectionId);
//     if (!section) {
//       res.status(404).json({ error: "Section not found" });
//       return;
//     }

//     course.sections.pull(req.params.sectionId);
//     await course.save();

//     res.json({ message: "Section deleted" });
//   } catch (err) {
//     next(err);
//   }
// };

// --- ALTERNATIVE: Use $pull for direct DB removal (uncomment if you prefer this way) ---
export const deleteSection = async (req: Request, res: Response, next: NextFunction) => {
  const {courseId, sectionId} = req.params;
  try {
    const result = await Course.updateOne(
      { _id: req.params.courseId },
      { $pull: { sections: { _id: req.params.sectionId } } }
    );
    if (result.modifiedCount === 0) {
      res.status(404).json({ error: "Section not found or already deleted" });
      return;
    }
    await CourseProgress.updateMany(
      { course: courseId },
      { $pull: { completedSections: sectionId } }
    );
    res.json({ message: "Section deleted" });
  } catch (err) {
    next(err);
  }
};

