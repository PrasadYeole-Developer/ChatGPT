const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth.controllers");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", authControllers.registerUser);
router.post("/login", authControllers.loginUser);
router.post("/logout", authControllers.logoutUser);
router.get("/me", authMiddleware.authUser, authControllers.getCurrentUser);

module.exports = router;
