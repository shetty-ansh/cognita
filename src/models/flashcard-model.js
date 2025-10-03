import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    question: String,
    answer: String,
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
  

export default mongoose.model('Flashcard', flashcardSchema);
