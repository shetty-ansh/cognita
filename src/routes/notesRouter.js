import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import { createNotes, getUserNotes } from "../controllers/notes-controller.js";

const notesRouter = Router();

notesRouter.post('/', verifyJWT, createNotes);
notesRouter.get('/',verifyJWT, getUserNotes)

export default notesRouter;  
