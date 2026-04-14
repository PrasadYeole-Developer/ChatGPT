const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/create-chat", authMiddleware.authUser, createChat);

module.exports = router;
