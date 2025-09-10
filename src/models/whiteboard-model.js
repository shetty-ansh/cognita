import mongoose from "mongoose";
import { User } from "./user-model";

const whiteboardSchema = new mongoose.Schema({
  sessionName: String,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  drawings: Array, 
}, { timestamps: true });

export const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema) 