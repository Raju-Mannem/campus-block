import { uploadFileToS3, uploadFolderToS3 } from "./s3";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();
ffmpeg.setFfprobePath(ffprobeStatic.path); 

export const updateCourseContent = (course: any, sectionId: string, s3Key: string) => {
  const sectionIndex = course.sections.findIndex((s: any) => s.sectionId === sectionId);
  if (sectionIndex !== -1) {
    course.sections[sectionIndex].content = s3Key;
  }
};

export const handlePdfUpload = async (files: Express.Multer.File[]): Promise<string> => {
  const file = files[0];
  return await uploadFileToS3(file, "course-content");
};

export const validateUploadedFiles = (files: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }
};

export const getContentType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".m3u8":
      return "application/vnd.apple.mpegurl";
    case ".mpd":
      return "application/dash+xml";
    case ".ts":
      return "video/MP2T";
    case ".m4s":
      return "video/iso.segment";
    case ".pdf":
      return "document/pdf";
    default:
      return "application/octet-stream";
  }
};

export const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
};

export const handleAdvancedVideoUpload = async (
  files: Express.Multer.File[]
): Promise<{ s3Key: string; duration: number } | null> => {
  const file = files[0];
  const fileExt = path.extname(file.originalname);
  if (![".mp4", ".mov", ".mkv", ".avi"].includes(fileExt.toLowerCase())) return null;

  const outputKey = `course-content/${uuidv4()}/manifest.mpd`;
  const outputDir = `/tmp/${uuidv4()}`;
  const inputPath = `/tmp/${uuidv4()}-${file.originalname}`;

  await fs.promises.mkdir(outputDir, { recursive: true });
  await fs.promises.writeFile(inputPath, file.buffer);

  const duration = await getVideoDuration(inputPath);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions("-y")
      .videoCodec("libx264")
      .audioCodec("aac")
      .addOptions([
        "-preset veryfast",
        "-g 48",
        "-sc_threshold 0",
        "-map 0:v:0",
        "-map 0:a:0",
        "-b:v:0 5000k",
        "-s:v:0 1920x1080",
        "-b:v:1 3000k", 
        "-s:v:1 1280x720",
        "-b:v:2 1000k",
        "-s:v:2 640x360",
        "-use_template 1",
        "-use_timeline 1",
        "-seg_duration 6",
        "-f dash"
      ])
      .output(`${outputDir}/manifest.mpd`)
      .on("progress", p => console.log(`Encoding progress: ${p.percent?.toFixed(2)}%`))
      .on("end", () => {
        console.log("DASH encoding finished");
        resolve();
      })
      .on("error", err => {
        console.error("DASH encoding error:", err);
        reject(err);
      })
      .run();
  });

  // Upload all generated DASH files
  await uploadFolderToS3(outputDir, outputKey.replace("course-content/", "").replace("/manifest.mpd", ""));

  // Cleanup
  await fs.promises.rm(outputDir, { recursive: true, force: true });
  await fs.promises.rm(inputPath, { force: true });

  return { s3Key: outputKey, duration };
};

export const mergeSections = (
  existingSections: any[],
  newSections: any[]
): any[] => {
  const existingSectionsMap = new Map<string, any>();
  for (const existingSection of existingSections) {
    existingSectionsMap.set(existingSection.sectionId, existingSection);
  }

  for (const newSection of newSections) {
    const section = existingSectionsMap.get(newSection.sectionId);
    if (!section) {
      existingSectionsMap.set(newSection.sectionId, newSection);
    } 
  }

  return Array.from(existingSectionsMap.values());
};

export const calculateOverallProgress = (sections: any[]): number => {
  const totalSections = sections.reduce(
    (acc: number, section: any) => acc + section.length,
    0
  );

  const completedSections = sections.reduce(
    (acc: number, section: any) =>
      acc + section.filter((section: any) => section.completed).length,
    0
  );

  return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
};
