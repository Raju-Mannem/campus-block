import express, { Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import serverlessExpress from "@vendia/serverless-express";
import { Connection } from 'mongoose';
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import courseRoutes from "./routes/courseRoutes";
import transactionRoutes from "./routes/orderRoutes";
import userCourseProgressRoutes from "./routes/progressRoutes";
import adminUserRoutes from "./routes/adminUserRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import playbackRoutes from "./routes/playbackRoutes";
import sectionRoutes from "./routes/sectionRoutes";
import userRoutes from "./routes/userRoutes";
import mediaRoutes from "./routes/mediaRoutes";

dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
let dbConnectionPromise: Promise<Connection>;

export const app = express();
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
  origin: isProduction ? ["https://yourfrontend.com"] : "*",
  credentials: true
}));

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/users/course-progress", userCourseProgressRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/playback", playbackRoutes);
app.use("/api/v1/courses/:courseId/sections", sectionRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use(errorHandler);

/* SERVER */
const port = process.env.PORT || 3000;
if (!isProduction) {
  connectDB().then(() => {
    app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
}

const serverlessApp = serverlessExpress({app});
export const handler = async (event: any, context: any) => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB();
  }
  await dbConnectionPromise;
    return serverlessApp(event, context);
};