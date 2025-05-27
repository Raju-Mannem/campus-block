import { z } from "zod";

export const SectionSchema = z.object({
  type: z.enum(["Text", "Quiz", "Video", "Pdf"]),
  sectionTitle: z.string().min(1),
  sectionDescription: z.string().optional(),
  content: z.string().min(1),
  videoMetadata: z
    .object({
      duration: z.number(),
      width: z.number(),
      height: z.number(),
      format: z.string(),
    })
    .optional(),
});

export const CourseCreateSchema = z.object({
  instructorName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  image: z.string().optional(),
  price: z.number().optional(),
  discount: z.number().optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  status: z.enum(["Drafts", "Published"]),
  sections: z.array(SectionSchema),
});

export const CourseUpdateSchema = CourseCreateSchema.partial();
