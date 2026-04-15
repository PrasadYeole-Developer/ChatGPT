const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../Models/user.model");
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
    console.log("User connected: ", socket.user);
    console.log("New socket connection: ", socket.id);
    socket.on("ai-message", (messagePayload) => {
      console.log(messagePayload);
    });
  });
}

module.exports = initSocketServer;
