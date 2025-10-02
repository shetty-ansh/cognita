import express from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  startVideoSession,
  joinVideoSession,
  leaveVideoSession,
  endVideoSession,
  getVideoSession,
  getVideoSessionHistory,
  updateVideoSessionSettings
} from "../controllers/video-controller.js";

const videoRouter = express.Router();

// Video session management routes
videoRouter.post("/chatroom/:id/video/start", verifyJWT, startVideoSession);
videoRouter.post("/chatroom/:id/video/join", verifyJWT, joinVideoSession);
videoRouter.post("/chatroom/:id/video/leave", verifyJWT, leaveVideoSession);
videoRouter.post("/chatroom/:id/video/end", verifyJWT, endVideoSession);
videoRouter.get("/chatroom/:id/video", verifyJWT, getVideoSession);
videoRouter.get("/chatroom/:id/video/history", verifyJWT, getVideoSessionHistory);
videoRouter.patch("/chatroom/:id/video/settings", verifyJWT, updateVideoSessionSettings);

export default videoRouter;

