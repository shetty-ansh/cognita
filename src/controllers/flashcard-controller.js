import flashcard from '../models/flashcard-model.js';
import { apiError } from '../utils/apiError.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateFlashcards = async (req, res) => {
    try {
        const { text, userId } = req.body;

        if (!text || !userId) {
            throw new apiError(400, "Missing text or userId")
        }

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash", 
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Return flashcards in the following JSON format ONLY: 
                                    [
                                        { "question": "What is X?", "answer": "X is ..." },...
                                    ]
                                    No other text. Break down this content into simple flashcards: "${text}"`
                        }
                    ]
                }
            ]
        });

        const rawText = await geminiResponse.text();

        if (!rawText) {
            throw new apiError(500, "No text in Gemini response");
        }

        let flashcardData;
        try {
            flashcardData = JSON.parse(rawText);
        } catch (parseErr) {
            throw new apiError(500, "Invalid JSON from Gemini");
        }

        const cards = await flashcard.insertMany(
            flashcardData.map(fc => ({ ...fc, userId }))
        );

        return res.status(200).json(cards);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const message = err.message || "Error generating flashcards";
        return res.status(statusCode).json({ error: message });
      }
      
};


export const getFlashcards = async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        throw new apiError(400, "Missing userId in request params");
      }
  
      const cards = await flashcard.find({ userId });
  
      return res.status(200).json(cards);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Error fetching flashcards";
      return res.status(statusCode).json({ error: message });
    }
  };

  
export const deleteFlashcard = async (req, res) => {
    try {
      const { flashcardId } = req.params;
      const userId = req.user.id;
  
      if (!flashcardId) {
        throw new apiError(400, "Missing flashcard ID");
      }
  
      const card = await flashcard.findOne({ _id: flashcardId, userId });
  
      if (!card) {
        throw new apiError(404, "Flashcard not found or you don't have permission to delete it");
      }
  
      await flashcard.deleteOne({ _id: flashcardId });
  
      return res.status(200).json({ message: "Flashcard deleted successfully" });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Error deleting flashcard";
      return res.status(statusCode).json({ error: message });
    }
  };