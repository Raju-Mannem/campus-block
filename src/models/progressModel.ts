import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICourseProgress extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  completedSections: Types.ObjectId[];
  lastAccessedSection?: Types.ObjectId;
  progressPercent?: number;
  updatedAt: Date;
}

const courseProgressSchema = new Schema<ICourseProgress>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  completedSections: [{ type: Schema.Types.ObjectId }],
  lastAccessedSection: { type: Schema.Types.ObjectId },
  progressPercent: { type: Number, min: 0, max: 100 },
  updatedAt: { type: Date, default: Date.now }
});

courseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

export const CourseProgress = mongoose.model<ICourseProgress>('CourseProgress', courseProgressSchema);
