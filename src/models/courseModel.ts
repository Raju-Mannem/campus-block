import mongoose, { Schema, Document, Types } from 'mongoose';

// Course Schema
export interface ISection {
  type: "Text" | "Quiz" | "Video" | "Pdf";
  sectionTitle: string;
  sectionDescription?: string;
  content: string;
  videoMetadata?: {
    duration: number;
    width: number;
    height: number;
    format: string;
  };
}

export interface IEnrollment {
  userID: Types.ObjectId;
}

export interface ICourse extends Document {
  instructorName: string;
  title: string;
  description?: string;
  category: string;
  image?: string;
  price?: number;
  discount: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "Drafts" | "Published";
  sections: Types.DocumentArray<ISection>;
  enrollments: IEnrollment[];
}

// Section Schema
const sectionSchema = new Schema({
    type: {
      type: String,
      enum: ["Text", "Quiz", "Video", "Pdf"],
      required: true
    },
    sectionTitle: { type: String, required: true },
    sectionDescription: { type: String },
    // For "Video" type, content is the S3 key to master.m3u8
    content: { type: String, required: true },
    // Optional: Only for "Video" type, store HLS/video metadata
    videoMetadata: {
      duration: Number,
      width: Number,
      height: Number,
      format: String
    }
  });
  
  // Enrollment Schema
  const enrollmentSchema = new Schema({
    userID: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  });  

const courseSchema = new Schema<ICourse>({
  instructorName: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  image: String,
  price: Number,
  discount: Number,
  level: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"]
  },
  status: {
    type: String,
    required: true,
    enum: ["Drafts", "Published"]
  },
  sections: { type: [sectionSchema], required: true },
  enrollments: { type: [enrollmentSchema], default: [] }
},{ timestamps: true });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
