import express from "express";
import {
  addSection,
  updateSection,
  deleteSection
} from "../controllers/sectionController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router({ mergeParams: true });

// Sections are managed by admin/teacher
router.post("/:courseId/sections", requireAuth, requireAdmin, addSection);
router.put("/:courseId/sections/:sectionId", requireAuth, requireAdmin, updateSection);
router.delete("/:courseId/sections/:sectionId", requireAuth, requireAdmin, deleteSection);

export default router;
