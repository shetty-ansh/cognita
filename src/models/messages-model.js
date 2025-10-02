import mongoose from "mongoose";
import { User } from "./user-model.js";
import { Chatroom } from "./chatroom-model.js";

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Chatroom", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String }, // For regular messages
  messageType: { 
    type: String, 
    enum: ['text', 'video', 'videoSession', 'videoControl', 'videoEvent'], 
    default: 'text' 
  },
  videoUrl: { type: String }, // if messageType is 'video' (shared video file)
  
  // Video session related fields
  videoSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoSession" },
  videoEvent: {
    type: { type: String, enum: ['play', 'pause', 'seek', 'volume', 'rate', 'join', 'leave'] },
    data: { type: mongoose.Schema.Types.Mixed }, // Flexible data for different event types
    timestamp: { type: Number } // Video timestamp for sync
  },
  
  attachments: [String],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);
