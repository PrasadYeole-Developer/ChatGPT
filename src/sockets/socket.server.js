const { Server } = require("socket.io");
const { cookie } = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../Models/user.model");
require("dotenv");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (req, next) => {
    const cookies = cookie.parse(socket.handshake.headers.token || "");
    if (!cookies.token) {
      return new Error("Authentication error: No token provided");
    }
    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.fineById(decoded.id);
      socket.user = user;
      next();
    } catch (error) {
      console.log("Authenticatio error: ", error);
    }
  });

  io.on("connection", (socket) => {
    console.log("New socket connection: ", socket.id);
  });
}

module.exports = initSocketServer;
