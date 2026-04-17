const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory } = require("../services/vector.service");
require("dotenv").config();

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    if (!cookies.token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    try {
      socket.on("ai-message", async (messagePayload) => {
        const message = await messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        });
        console.log(messagePayload.content);
        const vectors = await aiService.generateVectors(messagePayload.content);
        console.log(vectors);

        await createMemory({
          vectors: vectors,
          messageId: message._id.toString(),
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
          },
        });
        const chatHistory = await messageModel
          .find({
            chat: messagePayload.chat,
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .reverse();
        const mappedChatHistory = chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.content }],
          };
        });
        const response = await aiService.generateResponse(mappedChatHistory);
        const responseMessage = await messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        });
        const responseVectors = await aiService.generateVectors(
          responseMessage.content,
        );
        await createMemory({
          vectors: responseVectors,
          messageId: responseMessage._id.toString(),
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
          },
        });
        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });
      });
    } catch (err) {
      console.error("Socket error:", err);
      socket.emit("error", "Something went wrong");
    }
  });
}

module.exports = initSocketServer;
