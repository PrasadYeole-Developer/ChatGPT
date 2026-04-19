const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");
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
    socket.on("ai-message", async (messagePayload) => {
      if (!messagePayload?.content?.trim()) {
        return socket.emit("error", "Message cannot be empty");
      }
      try {
        const message = await messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        });
        const vectors = await aiService.generateVectors(messagePayload.content);
        await createMemory({
          vectors: vectors,
          messageId: message._id.toString(),
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id.toString(),
            text: messagePayload.content,
          },
        });
        const memory = await queryMemory({
          queryVector: vectors,
          limit: 5,
          metadata: {
            user: { $eq: socket.user._id.toString() },
          },
        });
        const chatHistory = (
          await messageModel
            .find({
              chat: messagePayload.chat,
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const stm = chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.content }],
          };
        });

        const ltm = [
          {
            role: "system",
            parts: [
              {
                text: `Relevant past context:\n${memory.map((item) => item.metadata.text).join("\n")}`,
              },
            ],
          },
        ];

        const response = await aiService.generateResponse([...ltm, ...stm]);
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
            text: responseMessage.content,
          },
        });
        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });
      } catch (err) {
        console.error("Socket error:", err);
        socket.emit("error", "Something went wrong");
      }
    });
  });
}

module.exports = initSocketServer;
