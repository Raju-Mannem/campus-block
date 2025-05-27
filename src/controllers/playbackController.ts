import { Request, Response, NextFunction } from "express";
import { Course, IEnrollment } from "../models/courseModel";
import { getSignedCloudFrontUrl } from "../utils/cloudfrontSigner";

// GET /courses/:courseId/sections/:sectionId/playback-url
export const getPlaybackUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, sectionId } = req.params;
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const userId = req.user._id;      

    // 1. Check enrollment or admin
    const course = await Course.findById(courseId);
    if (!course){
      res.status(404).json({ error: "Course not found" });
      return ;
    } 

    // Adjust this check as per your user model
    const isEnrolled = course.enrollments.some(enr => enr.userID.equals(userId));
    if (!isEnrolled && !req.user.isAdmin) {
      res.status(403).json({ error: "Not enrolled in this course" });
      return;
    }

    // 2. Find section and check type
    const section = course.sections.id(sectionId);
    if (!section){
      res.status(404).json({ error: "Section not found" });
      return;
    }
    if (section.type !== "Video" || !section.content) {
      res.status(400).json({ error: "Section does not have a video" });
      return;
    }

    // 3. Generate signed CloudFront URL for the video
    const signedUrl = getSignedCloudFrontUrl(section.content as "s3Key");

    res.json({ playbackUrl: signedUrl });
  } catch (err) {
    next(err);
  }
};
