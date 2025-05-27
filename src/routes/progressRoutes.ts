import express from "express";
import {
  markSectionCompleted,
  getCourseProgress
} from "../controllers/progressController";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/:courseId/sections/:sectionId/complete", requireAuth, markSectionCompleted);
router.get("/:courseId", requireAuth, getCourseProgress);

export default router;
