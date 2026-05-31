const chatModel = require("../models/chat.model");

const createChat = async (req, res) => {
  const { title } = req.body;
  const user = req.user;
  const chat = await chatModel.create({
    user: user._id,
    title: title,
  });

  return res.status(201).json({
    message: "Chat created successfully.",
    chat: {
      id: chat._id,
      title: chat.title,
      lastActivity: chat.lastActivity,
      userId: user._id,
    },
  });
};

const getChats = async (req, res) => {
  try {
    const chats = await chatModel
      .find({
        user: req.user._id,
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      chats: chats.map((chat) => ({
        id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        userId: chat.user,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch chats",
    });
  }
};

module.exports = { createChat, getChats };
