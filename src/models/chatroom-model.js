import mongoose from "mongoose";
import { User } from "./user-model.js";

const chatroomSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String, enum: ["private", "public"], default: "public" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  
  // Video session tracking
  activeVideoSession: { type: mongoose.Schema.Types.ObjectId, ref: "VideoSession" },
  videoSessionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "VideoSession" }],
  
  // Video session settings
  allowVideoSharing: { type: Boolean, default: true },
  maxVideoParticipants: { type: Number, default: 50 }
}, { timestamps: true });


export const Chatroom = mongoose.model("Chatroom", chatroomSchema)