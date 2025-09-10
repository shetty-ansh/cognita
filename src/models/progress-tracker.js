import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subject: String,
  hoursStudied: { type: Number, default: 0 },
  completion: { type: Number, default: 0 }, // %
}, { timestamps: true });

export const Progress = mongoose.model("progressTracker", progressSchema)