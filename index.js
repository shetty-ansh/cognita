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
import { VideoSession } from "./src/models/video-session-model.js";
import tutorRouter from "./src/routes/tutorRouter.js";
import videoRouter from "./src/routes/videoRouter.js";
import notesRouter from "./src/routes/notesRouter.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("Helloooo"));
app.use("/users", userRouter);
app.use("/auth", googleRouter);
app.use("/chatrooms", chatroomRouter);
app.use("/tutor", tutorRouter);
app.use("/notes", notesRouter);
app.use("/api", videoRouter);

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

      // Video session events
      socket.on("joinVideoSession", async ({ roomId }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) {
            socket.emit("videoError", { message: "No active video session found" });
            return;
          }

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession)
            .populate('host', 'name email')
            .populate('participants', 'name email');

          if (!videoSession.participants.some(p => p._id.toString() === socket.user._id)) {
            videoSession.participants.push(socket.user._id);
            await videoSession.save();
          }

          socket.join(`${roomId}-video`);
          socket.to(`${roomId}-video`).emit("userJoinedVideo", {
            userId: socket.user._id,
            userName: socket.user.name,
            timestamp: Date.now()
          });

          socket.emit("videoSessionJoined", videoSession);
        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      socket.on("leaveVideoSession", async ({ roomId }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (chatroom && chatroom.activeVideoSession) {
            const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
            if (videoSession) {
              videoSession.participants = videoSession.participants.filter(
                p => p.toString() !== socket.user._id.toString()
              );
              await videoSession.save();
            }
          }

          socket.leave(`${roomId}-video`);
          socket.to(`${roomId}-video`).emit("userLeftVideo", {
            userId: socket.user._id,
            userName: socket.user.name,
            timestamp: Date.now()
          });
        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      // Video control events
      socket.on("videoPlay", async ({ roomId, timestamp }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) return;

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
          if (!videoSession || !videoSession.syncEnabled) return;

          // Update video session state
          videoSession.isPlaying = true;
          videoSession.currentTime = timestamp;
          videoSession.lastSyncTime = new Date();
          await videoSession.save();

          // Broadcast to other participants
          socket.to(`${roomId}-video`).emit("videoPlay", {
            timestamp,
            userId: socket.user._id,
            timestamp: Date.now()
          });

          // Log the event
          await Message.create({
            room: roomId,
            sender: socket.user._id,
            messageType: 'videoEvent',
            videoSessionId: videoSession._id,
            videoEvent: {
              type: 'play',
              data: { timestamp },
              timestamp: Date.now()
            }
          });

        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      socket.on("videoPause", async ({ roomId, timestamp }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) return;

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
          if (!videoSession || !videoSession.syncEnabled) return;

          // Update video session state
          videoSession.isPlaying = false;
          videoSession.currentTime = timestamp;
          videoSession.lastSyncTime = new Date();
          await videoSession.save();

          // Broadcast to other participants
          socket.to(`${roomId}-video`).emit("videoPause", {
            timestamp,
            userId: socket.user._id,
            timestamp: Date.now()
          });

          // Log the event
          await Message.create({
            room: roomId,
            sender: socket.user._id,
            messageType: 'videoEvent',
            videoSessionId: videoSession._id,
            videoEvent: {
              type: 'pause',
              data: { timestamp },
              timestamp: Date.now()
            }
          });

        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      socket.on("videoSeek", async ({ roomId, timestamp }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) return;

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
          if (!videoSession || !videoSession.syncEnabled) return;

          // Update video session state
          videoSession.currentTime = timestamp;
          videoSession.lastSyncTime = new Date();
          await videoSession.save();

          // Broadcast to other participants
          socket.to(`${roomId}-video`).emit("videoSeek", {
            timestamp,
            userId: socket.user._id,
            timestamp: Date.now()
          });

          // Log the event
          await Message.create({
            room: roomId,
            sender: socket.user._id,
            messageType: 'videoEvent',
            videoSessionId: videoSession._id,
            videoEvent: {
              type: 'seek',
              data: { timestamp },
              timestamp: Date.now()
            }
          });

        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      socket.on("videoVolumeChange", async ({ roomId, volume }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) return;

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
          if (!videoSession || !videoSession.syncEnabled) return;

          // Update video session state
          videoSession.volume = volume;
          videoSession.lastSyncTime = new Date();
          await videoSession.save();

          // Broadcast to other participants
          socket.to(`${roomId}-video`).emit("videoVolumeChange", {
            volume,
            userId: socket.user._id,
            timestamp: Date.now()
          });

        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      socket.on("videoRateChange", async ({ roomId, rate }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) return;

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
          if (!videoSession || !videoSession.syncEnabled) return;

          // Update video session state
          videoSession.playbackRate = rate;
          videoSession.lastSyncTime = new Date();
          await videoSession.save();

          // Broadcast to other participants
          socket.to(`${roomId}-video`).emit("videoRateChange", {
            rate,
            userId: socket.user._id,
            timestamp: Date.now()
          });

        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
      });

      socket.on("requestVideoSync", async ({ roomId }) => {
        try {
          const chatroom = await Chatroom.findById(roomId);
          if (!chatroom || !chatroom.activeVideoSession) {
            socket.emit("videoError", { message: "No active video session found" });
            return;
          }

          const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
          if (!videoSession) {
            socket.emit("videoError", { message: "Video session not found" });
            return;
          }

          // Send current video state to requesting user
          socket.emit("videoSync", {
            isPlaying: videoSession.isPlaying,
            currentTime: videoSession.currentTime,
            playbackRate: videoSession.playbackRate,
            volume: videoSession.volume,
            isMuted: videoSession.isMuted,
            timestamp: Date.now()
          });

        } catch (err) {
          socket.emit("videoError", { message: err.message });
        }
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
