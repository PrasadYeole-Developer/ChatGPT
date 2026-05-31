const messageModel = require("../models/message.model");

const getMessagesByChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await messageModel
      .find({
        chat: chatId,
      })
      .sort({ createdAt: 1 });

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
};

module.exports = {
  getMessagesByChat,
};
