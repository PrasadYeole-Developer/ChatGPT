const jwt = require("jsonwebtoken");
const userModel = require("../Models/user.model");

const authMiddleware = async (req, res, next) => {
  const { token } = res.cookies;
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Interval server error" });
  }
};
