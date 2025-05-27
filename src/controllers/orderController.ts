import { Request, Response, NextFunction } from "express";
import { Order } from "../models/orderModel";
import { Course } from "../models/courseModel";

// Create a new order (after payment or to start payment process)
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user){
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { courseId, amount, paymentId, status } = req.body;

    // Validate course existence
    const course = await Course.findById(courseId);
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return;
    }

    // Prevent duplicate orders for the same user and course with a pending or completed status
    const existingOrder = await Order.findOne({
      userId: req.user._id,
      courseId: courseId,
      status: { $in: ["pending", "paid", "failed"] }
    });
    if (existingOrder) {
      res.status(400).json({ error: "Order already exists for this course." });
      return;
    }

    // Create the order
    const order = new Order({
      userId: req.user._id,
      courseId: courseId,
      amount,
      paymentId,
      status: status || "pending"
    });
    await order.save();

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// Get all orders for the current user
export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user){
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const orders = await Order.find({ user: req.user._id }).populate("course");
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// (Admin) Get all orders for a course
export const getOrdersForCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.isAdmin){
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { courseId } = req.params;
    const orders = await Order.find({ courseId: courseId }).populate("userId");
    res.json(orders);
  } catch (err) {
    next(err);
  }
};
