const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const chatControllers = require("../controllers/chat.controllers");

router.post(
  "/create-chat",
  authMiddleware.authUser,
  chatControllers.createChat,
);
router.get("/", authMiddleware.authUser, chatControllers.getChats);
router.delete("/:chatId", authMiddleware.authUser, chatControllers.deleteChat);
router.patch("/:chatId", authMiddleware.authUser, chatControllers.renameChat);

module.exports = router;
