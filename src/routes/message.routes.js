const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const messageControllers = require("../controllers/message.controllers");

router.get(
  "/:chatId",
  authMiddleware.authUser,
  messageControllers.getMessagesByChat,
);

module.exports = router;