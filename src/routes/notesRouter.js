import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import { createNotes } from "../controllers/notes-controller.js";

const notesRouter = Router();

notesRouter.post('/', createNotes);
notesRouter.get('/')

export default notesRouter;  
