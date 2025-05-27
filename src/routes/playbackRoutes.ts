import express from "express";
import { getPlaybackUrl } from "../controllers/playbackController";
import { requireAuth } from "../middleware/auth";

const router = express.Router({ mergeParams: true });

router.get("/:courseId/sections/:sectionId/playback-url", requireAuth, getPlaybackUrl);

export default router;
