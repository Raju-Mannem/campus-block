import { Request, Response } from "express";
import { Course } from "../models/courseModel";
import { CourseProgress } from "../models/progressModel";
import { deleteS3Object, uploadFileToS3 } from "../utils/s3";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

// Helper to find section by ID
function findSection(course:any, sectionId:any) {
  return course.sections.id(sectionId);
}

ffmpeg.setFfprobePath(ffprobeStatic.path);

export function getVideoMetadata(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === "video");
      resolve({
        duration: metadata.format.duration,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name,
        format: metadata.format.format_name
      });
    });
  });
}

// DELETE media (video/pdf) from section
export const deleteMediaFromSection = async (req: Request, res: Response) => {
  const { courseId, sectionId, mediaType } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return
  }

  const section = findSection(course, sectionId);
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return
  }

  if (section.type !== mediaType) {
    res.status(400).json({ error: `Section does not contain a ${mediaType}` });
    return;
  }

  // Remove file from S3 if content is an S3 key
  if (section.content) {
    await deleteS3Object(section.content);
  }

  // Remove metadata if video
  if (mediaType === "Video") {
    section.videoMetadata = undefined;
  }

  // Remove content reference
  section.content = "";

  await course.save();

  // Remove section from completedSections in progress docs
  await CourseProgress.updateMany(
    { course: courseId },
    { $pull: { completedSections: sectionId } }
  );

  res.status(200).json({ message: `${mediaType} deleted from section` });
};

// UPLOAD media (video/pdf) to section
export const uploadMediaToSection = async (req: Request, res: Response) => {
  const { courseId, sectionId, mediaType } = req.params;

  if (!['upload', 'pdf', 'video'].includes(mediaType)) {
    res.status(400).json({ error: 'Invalid media type' });
    return;
  }

  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const section = findSection(course, sectionId);
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  
  if(section.type=="video"){
    const videoMeta = await getVideoMetadata(file.path);
    section.videoMetadata = videoMeta;
  }

  // Upload file to S3
  const s3Key = await uploadFileToS3(file, mediaType);

  section.content = s3Key;

  // If video, extract and save metadata (implement as needed)
  if (mediaType === "Video") {
    // Extract metadata using ffprobe or similar
    section.videoMetadata = {/* ... */};
  }

  await course.save();

  res.status(200).json({ message: `${mediaType} uploaded`, s3Key });
};
