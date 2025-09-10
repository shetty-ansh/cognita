import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  source: { type: String, enum: ["manual", "ai", "upload"], default: "manual" },
}, { timestamps: true });


