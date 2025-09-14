import mongoose from "mongoose";
import { User } from "./user-model.js";
import { Chatroom } from "./chatroom-model.js";

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Chatroom", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  attachments: [String],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);
