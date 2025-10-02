import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { VideoSession } from "../models/video-session-model.js";
import { Chatroom } from "../models/chatroom-model.js";
import { Message } from "../models/messages-model.js";

// Start a new video session in a chatroom
export const startVideoSession = asyncHandler(async (req, res) => {
  try {
    const { videoUrl, title, description, enableVideoChat = false } = req.body;
    const chatroomId = req.params.id;
    const userId = req.user._id;

    // Check if user is a member of the chatroom
    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    if (!chatroom.members.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this chatroom" });
    }

    // Check if video sharing is allowed
    if (!chatroom.allowVideoSharing) {
      return res.status(403).json({ message: "Video sharing is not allowed in this chatroom" });
    }

    // End any existing active video session
    if (chatroom.activeVideoSession) {
      await VideoSession.findByIdAndUpdate(chatroom.activeVideoSession, {
        isActive: false,
        endedAt: new Date()
      });
    }

    // Create new video session
    const videoSession = await VideoSession.create({
      chatroom: chatroomId,
      host: userId,
      participants: [userId],
      videoUrl,
      title,
      description,
      enableVideoChat,
      syncEnabled: true
    });

    // Update chatroom with new active session
    await Chatroom.findByIdAndUpdate(chatroomId, {
      activeVideoSession: videoSession._id,
      $push: { videoSessionHistory: videoSession._id }
    });

    // Create system message
    await Message.create({
      room: chatroomId,
      sender: userId,
      messageType: 'videoSession',
      content: `Started video session: ${title || 'Untitled Video'}`,
      videoSessionId: videoSession._id
    });

    const populatedSession = await videoSession.populate('host', 'name email');

    res.status(201).json({
      message: "Video session started successfully",
      videoSession: populatedSession
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join an existing video session
export const joinVideoSession = asyncHandler(async (req, res) => {
  try {
    const chatroomId = req.params.id;
    const userId = req.user._id;

    const chatroom = await Chatroom.findById(chatroomId).populate('activeVideoSession');
    if (!chatroom || !chatroom.activeVideoSession) {
      return res.status(404).json({ message: "No active video session found" });
    }

    if (!chatroom.members.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this chatroom" });
    }

    const videoSession = chatroom.activeVideoSession;

    // Add user to participants if not already there
    if (!videoSession.participants.includes(userId)) {
      videoSession.participants.push(userId);
      await videoSession.save();

      // Create join message
      await Message.create({
        room: chatroomId,
        sender: userId,
        messageType: 'videoEvent',
        content: `Joined the video session`,
        videoSessionId: videoSession._id,
        videoEvent: {
          type: 'join',
          timestamp: Date.now()
        }
      });
    }

    const populatedSession = await VideoSession.findById(videoSession._id)
      .populate('host', 'name email')
      .populate('participants', 'name email');

    res.json({
      message: "Joined video session successfully",
      videoSession: populatedSession
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leave video session
export const leaveVideoSession = asyncHandler(async (req, res) => {
  try {
    const chatroomId = req.params.id;
    const userId = req.user._id;

    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom || !chatroom.activeVideoSession) {
      return res.status(404).json({ message: "No active video session found" });
    }

    const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
    if (!videoSession) {
      return res.status(404).json({ message: "Video session not found" });
    }

    // Remove user from participants
    videoSession.participants = videoSession.participants.filter(
      participant => participant.toString() !== userId.toString()
    );

    // Create leave message
    await Message.create({
      room: chatroomId,
      sender: userId,
      messageType: 'videoEvent',
      content: `Left the video session`,
      videoSessionId: videoSession._id,
      videoEvent: {
        type: 'leave',
        timestamp: Date.now()
      }
    });

    // If no participants left, end the session
    if (videoSession.participants.length === 0) {
      videoSession.isActive = false;
      videoSession.endedAt = new Date();
      await Chatroom.findByIdAndUpdate(chatroomId, {
        activeVideoSession: null
      });
    }

    await videoSession.save();

    res.json({ message: "Left video session successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// End video session (host only)
export const endVideoSession = asyncHandler(async (req, res) => {
  try {
    const chatroomId = req.params.id;
    const userId = req.user._id;

    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom || !chatroom.activeVideoSession) {
      return res.status(404).json({ message: "No active video session found" });
    }

    const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
    if (!videoSession) {
      return res.status(404).json({ message: "Video session not found" });
    }

    // Check if user is the host
    if (videoSession.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the video session" });
    }

    // End the session
    videoSession.isActive = false;
    videoSession.endedAt = new Date();
    await videoSession.save();

    // Update chatroom
    await Chatroom.findByIdAndUpdate(chatroomId, {
      activeVideoSession: null
    });

    // Create system message
    await Message.create({
      room: chatroomId,
      sender: userId,
      messageType: 'videoSession',
      content: `Video session ended`,
      videoSessionId: videoSession._id
    });

    res.json({ message: "Video session ended successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current video session
export const getVideoSession = asyncHandler(async (req, res) => {
  try {
    const chatroomId = req.params.id;

    const chatroom = await Chatroom.findById(chatroomId)
      .populate({
        path: 'activeVideoSession',
        populate: [
          { path: 'host', select: 'name email' },
          { path: 'participants', select: 'name email' }
        ]
      });

    if (!chatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    res.json({
      videoSession: chatroom.activeVideoSession,
      chatroomSettings: {
        allowVideoSharing: chatroom.allowVideoSharing,
        maxVideoParticipants: chatroom.maxVideoParticipants
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get video session history
export const getVideoSessionHistory = asyncHandler(async (req, res) => {
  try {
    const chatroomId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    const sessions = await VideoSession.find({
      _id: { $in: chatroom.videoSessionHistory }
    })
      .populate('host', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: chatroom.videoSessionHistory.length
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update video session settings (host only)
export const updateVideoSessionSettings = asyncHandler(async (req, res) => {
  try {
    const chatroomId = req.params.id;
    const userId = req.user._id;
    const { allowUserControl, syncEnabled, enableVideoChat } = req.body;

    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom || !chatroom.activeVideoSession) {
      return res.status(404).json({ message: "No active video session found" });
    }

    const videoSession = await VideoSession.findById(chatroom.activeVideoSession);
    if (!videoSession) {
      return res.status(404).json({ message: "Video session not found" });
    }

    // Check if user is the host
    if (videoSession.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can update session settings" });
    }

    // Update settings
    if (allowUserControl !== undefined) videoSession.allowUserControl = allowUserControl;
    if (syncEnabled !== undefined) videoSession.syncEnabled = syncEnabled;
    if (enableVideoChat !== undefined) videoSession.enableVideoChat = enableVideoChat;

    await videoSession.save();

    res.json({
      message: "Video session settings updated successfully",
      videoSession
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

