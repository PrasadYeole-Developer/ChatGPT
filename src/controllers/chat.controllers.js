const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");

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

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized to delete this chat",
      });
    }

    await Promise.all([
      chatModel.findByIdAndDelete(chatId),
      messageModel.deleteMany({
        chat: chatId,
      }),
    ]);

    return res.status(200).json({
      message: "Chat deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete chat",
    });
  }
};

const renameChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    chat.title = title.trim();

    await chat.save();

    return res.status(200).json({
      message: "Chat renamed successfully",
      chat: {
        id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        userId: chat.user,
      },
    });
  } catch (error) {
    console.error("RENAME CHAT ERROR:", error);

    return res.status(500).json({
      message: "Failed to rename chat",
    });
  }
};

module.exports = { createChat, getChats, deleteChat, renameChat };
