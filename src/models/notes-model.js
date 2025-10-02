import mongoose, { Model, model } from "mongoose";

const NoteSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  source: { type: String, enum: ["manual", "ai"], default: "manual" },
}, { timestamps: true });


export const Notes =  mongoose.model("Notes", NoteSchema);
