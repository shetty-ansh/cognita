import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/db.js";
import userRouter from "./src/routes/userRouter.js";
import googleRouter from "./src/routes/googleRouter.js";
import { apiError } from "./src/utils/apiError.js";
import chatroomRouter from "./src/routes/chatroomRouter.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Chatroom } from "./src/models/chatroom-model.js";
import { Message } from "./src/models/messages-model.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("Helloooo"));
app.use("/users", userRouter);
app.use("/auth", googleRouter);
app.use("/chatrooms", chatroomRouter);

const startServer = async () => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) throw new apiError(500, "Couldn't Connect to DB");
    console.log("✅ Database Connected Successfully!");

    // Use same server for Express + Socket.IO
    const server = createServer(app);

    const io = new Server(server, {
      cors: { origin: "*" }
    });

    // Middleware: verify JWT for socket auth
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.user = decoded; // attach user
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    });

    // Socket events
    io.on("connection", (socket) => {
      console.log("✅ User connected:", socket.user._id);

      // Join chatroom
      socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`📌 User ${socket.user._id} joined room ${roomId}`);
      });

      // Send message
      socket.on("sendMessage", async ({ roomId, content }) => {
        const msg = await Message.create({
          room: roomId,
          sender: socket.user._id,
          content
        });

        await Chatroom.findByIdAndUpdate(roomId, { lastMessage: msg._id });
        const populated = await msg.populate("sender", "name email");

        io.to(roomId).emit("newMessage", populated);
      });

      // user starts typing
      socket.on("typing", ({ roomId }) => {
        socket.to(roomId).emit("userTyping", { userId: socket.user.id });
      });

      // user stops typing
      socket.on("stopTyping", ({ roomId }) => {
        socket.to(roomId).emit("userStoppedTyping", { userId: socket.user.id });
      });

      socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.user._id);
      });
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Startup Error:", error);
    process.exit(1);
  }
};

startServer();
