import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import { createNotes, getUserNotes } from "../controllers/notes-controller.js";
import { generateFlashcards, getFlashcards, deleteFlashcard } from "../controllers/flashcard-controller.js";

const notesRouter = Router();

notesRouter.post('/', verifyJWT, createNotes);
notesRouter.get('/:userId',verifyJWT, getUserNotes)
notesRouter.post('/flashcards', verifyJWT, generateFlashcards);
notesRouter.get('/flashcards/:userId',verifyJWT, getFlashcards)
notesRouter.delete('/flashcards/:flashcardId', verifyJWT, deleteFlashcard);


export default notesRouter;  
