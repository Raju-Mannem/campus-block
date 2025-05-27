import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    amount: number;
    paymentId: string;
    status: string;
    createdAt: Date;
  }

const orderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    paymentId: String,
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed'], 
      default: 'pending' 
    },
    paymentAttempts: { type: Number, default: 0 },
    paymentDetails: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);