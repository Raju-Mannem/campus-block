import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
} from "../controllers/paymentController";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/create-order", requireAuth, createRazorpayOrder);
router.post("/verify", requireAuth, verifyRazorpayPayment);
// Webhook: must use raw body for signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);

export default router;
