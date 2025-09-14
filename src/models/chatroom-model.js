import mongoose from "mongoose";
import { User } from "./user-model.js";

const chatroomSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String, enum: ["private", "public"], default: "public" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
}, { timestamps: true });


export const Chatroom = mongoose.model("Chatroom", chatroomSchema)