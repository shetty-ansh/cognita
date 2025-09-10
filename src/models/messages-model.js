import mongoose from "mongoose";
import { User } from "./user-model";
import { Chatroom } from "./chatroom-model";

const MessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Chatroom" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  attachments: [String], 
}, { timestamps: true });
