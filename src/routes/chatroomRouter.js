import express from "express"
import verifyJWT from "../middlewares/auth.js"
import {createChatroom , getChatrooms, getMessages, sendMessage} from "../controllers/chatroom-controller.js"

const chatroomRouter = express.Router();

chatroomRouter.post("/", verifyJWT, createChatroom);
chatroomRouter.get("/", verifyJWT, getChatrooms);
chatroomRouter.get("/:id/messages", verifyJWT, getMessages);
chatroomRouter.post("/:id/messages", verifyJWT, sendMessage);

export default chatroomRouter

