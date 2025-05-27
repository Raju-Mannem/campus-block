import express from "express";
import {
  createCourse,
  updateCourse,
  getAllCourses,
  getCourseById,
  deleteCourse
} from "../controllers/courseController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

// Protect admin-only routes globally under this prefix
router.post("/", requireAuth, requireAdmin, createCourse);
router.put("/:id", requireAuth, requireAdmin, updateCourse);
router.delete("/:id", requireAuth, requireAdmin, deleteCourse);

// Public access
router.get("/", getAllCourses);
router.get("/:id", requireAuth, getCourseById);

export default router;
