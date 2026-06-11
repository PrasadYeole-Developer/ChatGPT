const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");
const userModel = require("../Models/user.model");
require("dotenv").config();

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });
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
      const isTemporary = messagePayload.isTemporary;
      if (!messagePayload?.content?.trim()) {
        return socket.emit("error", "Message cannot be empty");
      }
      try {
        const vectors = await aiService.generateVectors(messagePayload.content);

        let message = null;

        if (!isTemporary) {
          message = await messageModel.create({
            chat: messagePayload.chat,
            user: socket.user._id,
            content: messagePayload.content,
            role: "user",
          });
        }

        let memory = [];
        let chatHistoryRaw = [];

        if (!isTemporary) {
          [memory, chatHistoryRaw] = await Promise.all([
            queryMemory({
              queryVector: vectors,
              limit: 5,
              metadata: {
                user: socket.user._id.toString(),
              },
            }),
            messageModel
              .find({
                chat: messagePayload.chat,
              })
              .sort({ createdAt: -1 })
              .limit(20)
              .lean(),
          ]);
        }

        const chatHistory = chatHistoryRaw.reverse();

        if (!isTemporary && message) {
          await createMemory({
            vectors,
            messageId: message._id.toString(),
            metadata: {
              chat: messagePayload.chat,
              user: socket.user._id,
              text: messagePayload.content,
            },
          });
        }

        let stm = [];

        if (isTemporary) {
          stm = [
            {
              role: "user",
              parts: [
                {
                  text: messagePayload.content,
                },
              ],
            },
          ];
        } else {
          stm = chatHistory.map((item) => {
            return {
              role: item.role,
              parts: [{ text: item.content }],
            };
          });
        }

        const ltm = memory.length
          ? [
              {
                role: "system",
                parts: [
                  {
                    text: `Relevant past context:\n${memory.map((item) => item.metadata?.text ?? "").join("\n")}`,
                  },
                ],
              },
            ]
          : [];

        const response = await aiService.generateResponse([...ltm, ...stm]);

        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });

        if (!isTemporary) {
          const [responseMessage, responseVectors] = await Promise.all([
            messageModel.create({
              chat: messagePayload.chat,
              user: socket.user._id,
              content: response,
              role: "model",
            }),
            aiService.generateVectors(response),
          ]);

          await createMemory({
            vectors: responseVectors,
            messageId: responseMessage._id.toString(),
            metadata: {
              chat: messagePayload.chat,
              user: socket.user._id,
              text: responseMessage.content,
            },
          });
        }
      } catch (err) {
        console.error("Socket error:", err);
        socket.emit("error", "Something went wrong");
      }
    });
  });
}

module.exports = initSocketServer;
