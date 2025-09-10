import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema({
  question: String,
  answer: String,
  topic: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const QuizSchema = new mongoose.Schema({
  title: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
