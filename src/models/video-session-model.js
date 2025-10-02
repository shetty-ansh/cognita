import mongoose from "mongoose";
import { User } from "./user-model.js";
import { Chatroom } from "./chatroom-model.js";

const videoSessionSchema = new mongoose.Schema({
  chatroom: { type: mongoose.Schema.Types.ObjectId, ref: "Chatroom", required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  videoUrl: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  
  // Video playback state
  isPlaying: { type: Boolean, default: false },
  currentTime: { type: Number, default: 0 },
  playbackRate: { type: Number, default: 1 },
  volume: { type: Number, default: 1 },
  isMuted: { type: Boolean, default: false },
  
  // Synchronization
  lastSyncTime: { type: Date, default: Date.now },
  syncEnabled: { type: Boolean, default: true },
  
  // Session management
  isActive: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  
  // Permissions
  allowUserControl: { type: Boolean, default: true },
  controlLockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Chat integration
  enableVideoChat: { type: Boolean, default: false },
  
}, { timestamps: true });

// Index for efficient queries
videoSessionSchema.index({ chatroom: 1, isActive: 1 });
videoSessionSchema.index({ host: 1 });

export const VideoSession = mongoose.model("VideoSession", videoSessionSchema);

