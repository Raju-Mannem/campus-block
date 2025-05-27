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
