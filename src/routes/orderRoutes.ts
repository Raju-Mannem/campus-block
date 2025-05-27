import express from "express";
import {
  getMyOrders,
  getOrdersForCourse
} from "../controllers/orderController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

router.get("/mine", requireAuth, getMyOrders);
router.get("/course/:courseId", requireAuth, requireAdmin, getOrdersForCourse);

export default router;
