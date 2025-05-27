import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_TMP_DIR || "/tmp";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

function imageFileFilter(req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"));
  }
  cb(null, true);
}

function videoFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  // Accept common video types for DASH input
  if (!["video/mp4", "video/quicktime", "video/x-matroska", "video/x-msvideo"].includes(file.mimetype)) {
    return cb(new Error("Only video files (.mp4, .mov, .mkv, .avi) are allowed!"));
  }
  cb(null, true);
}

function pdfFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed!"));
  }
  cb(null, true);
}

export const uploadCourseImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB (adjust as needed)
});

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});