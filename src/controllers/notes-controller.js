import { GoogleGenAI } from '@google/genai';
import { apiError } from '../utils/apiError.js';
import {Notes} from '../models/notes-model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getGeminiResponseNotes(prompt) {
  try {
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Your response will be saved directly as notes. The first sentence will be used as the title, and the rest as the content. Explain everything clearly but not too technically. No extra information. "${prompt}"`
            }
          ]
        }
      ]
    });

    const text = geminiResponse.text;

    if (!text) {
      throw new apiError(500, "No text in Gemini response");
    }

    return text;
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw new apiError(500, "Failed to get response from Gemini");
  }
}

export const createNotes = asyncHandler(async (req, res) => {
  const { prompt, title, content } = req.body;

  let notesTitle = title || "NOTES";
  let notesContent = content || "";

  if (prompt) {
    const geminiNotes = await getGeminiResponseNotes(prompt);

    const [firstSentence, ...rest] = geminiNotes.split(/(?<=\.)\s+/); 
    notesTitle = firstSentence?.trim() || notesTitle;
    notesContent = rest.join(" ").trim() || notesContent;
  }

  try {
    const newNote = await Notes.create({
      title: notesTitle,
      content: notesContent,
      source: prompt ? "ai" : "manual",
      createdBy: req.user?._id, 
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: newNote,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    throw new apiError(500, "Problem while creating note");
  }
});

export const getUserNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const notes = await Notes.find({ createdBy: userId }).sort({ createdAt: -1 });

  if (!notes || notes.length === 0) {
    return res.status(404).json({ message: "No notes found for this user." });
  }

  res.status(200).json({
    success: true,
    count: notes.length,
    notes,
  });
});
