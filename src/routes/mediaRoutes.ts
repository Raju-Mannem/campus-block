import express from "express";
import { uploadMediaToSection, deleteMediaFromSection } from "../controllers/mediaController";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {uploadVideo} from "../utils/multer"; // adjust for your multer config

const router = express.Router({ mergeParams: true });

// Upload media (video/pdf) to section
router.post(
  "/:courseId/sections/:sectionId/:mediaType", // e.g., /courses/123/sections/456/Video
  requireAuth,
  requireAdmin,
  uploadVideo.single("file"), // Adjust for your multer config
  uploadMediaToSection
);

// Delete media (video/pdf) from section
router.delete(
  "/:courseId/sections/:sectionId/:mediaType",
  requireAuth,
  requireAdmin,
  deleteMediaFromSection
);

export default router;
