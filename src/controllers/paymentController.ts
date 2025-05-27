import Razorpay from "razorpay";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { Order } from "../models/orderModel";
import { Course } from "../models/courseModel";
import { User } from "../models/userModel";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

// 1. Create Razorpay Order and Local Order Record
export const createRazorpayOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id; // assuming requireAuth middleware

    const existing = await Order.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["pending", "paid"] },
    });
    if (existing) {
      res.status(400).json({ error: "Order already exists" });
      return;
    }

    // 1. Find course and get amount
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    const amount = course.price!; // assuming you have a price field

    // 2. Create Razorpay order
    const options = {
      amount: amount * 100, // INR paise
      currency: "INR",
      receipt: `${userId}_${courseId}_${Date.now()}`,
      payment_capture: 1,
    };
    const razorpayOrder = await razorpay.orders.create(options);

    // 3. Create local order record in MongoDB
    await Order.create({
      user: userId,
      course: courseId,
      amount,
      paymentId: razorpayOrder.id,
      status: "pending",
    });

    // 4. Return order info to frontend
    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: "INR",
      courseId,
    });
  } catch (err) {
    next(err);
  }
};

// 2. Verify Razorpay Payment (after frontend receives payment success)
export const verifyRazorpayPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // 1. Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    // 2. Update local order status and enroll user
    const order = await Order.findOneAndUpdate(
      { paymentId: razorpay_order_id },
      { status: "paid" },
      { new: true }
    );
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Enroll user in course
    await User.findByIdAndUpdate(order.userId, {
      $addToSet: { coursesEnrolled: order.courseId },
    });

    // Optionally update course stats
    await Course.findByIdAndUpdate(order.courseId, 
      { $addToSet: { "enrollments.userID": order.userId } },
      {$inc: { enrolledCount: 1 },}
      );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// 3. Handle Razorpay Webhook (for payment status updates)
export const handleRazorpayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verify webhook signature
    const razorpaySignature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);

    const generatedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    // 2. Handle event types
    const {eventType, payload} = req.body;

    switch (eventType) {
      case "payment.captured":
        await handleSuccessfulPayment(payload.payment.entity);
        break;
      case "payment.failed":
        await handleFailedPayment(payload.payment.entity);
        break;
      case "order.paid":
        // Optionally handle order.paid
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).send("Webhook processed");
  } catch (err) {
    next(err);
  }
};

// --- Helper functions for webhook events ---
const handleSuccessfulPayment = async (payment: any) => {
  const order = await Order.findOneAndUpdate(
    { paymentId: payment.order_id },
    {
      status: "paid",
      paymentDetails: payment,
    },
    { new: true }
  );
  if (!order) return;

  await User.findByIdAndUpdate(order.userId, {
    $addToSet: { coursesEnrolled: order.courseId },
  });
  await Course.findByIdAndUpdate(order.courseId, {
    $inc: { enrolledCount: 1 },
  });
};

const handleFailedPayment = async (payment: any) => {
  await Order.findOneAndUpdate(
    { paymentId: payment.order_id },
    {
      status: "failed",
      paymentDetails: payment,
    }
  );
};
