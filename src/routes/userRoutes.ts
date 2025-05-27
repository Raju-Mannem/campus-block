import express from "express";
import { getMe, updateMe, getMyCourses } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.get("/me/courses", requireAuth, getMyCourses);

export default router;
