import express from "express"
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { Chatroom } from "../models/chatroom-model.js";
import { Message } from "../models/messages-model.js";


export const createChatroom = asyncHandler( async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!members.includes(req.user.id)) members.push(req.user.id);

    const room = await Chatroom.create({ name, members });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

export const getChatrooms = asyncHandler(async (req, res) => {
  try {
    const rooms = await Chatroom.find({ members: req.user.id })
      .populate("lastMessage")
      .populate("members", "name email");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const getMessages = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const messages = await Message.find({ room: req.params.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "name email");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const msg = await Message.create({
      room: req.params.id,
      sender: req.user._id,
      content,
      readBy: [req.user.id]
    });

    await Chatroom.findByIdAndUpdate(req.params.id, { lastMessage: msg._id });

    const populated = await msg.populate("sender", "name email");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});