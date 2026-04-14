const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const chatControllers = require("../controllers/chat.controllers");

router.post(
  "/create-chat",
  authMiddleware.authUser,
  chatControllers.createChat,
);

module.exports = router;
