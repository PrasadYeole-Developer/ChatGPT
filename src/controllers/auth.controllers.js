const userModel = require("../Models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const {
    email,
    fullName: { firstName, lastName },
    password,
  } = req.body;

  const isUserAlreadyExists = await userModel.findOne({ email });

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "Email already exists! Please try with different email.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    email: email,
    fullName: { firstName, lastName },
    password: hashedPassword,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token);

  return res.status(200).json({
    message: "User registered successfully.",
    user: {
      id: user._id,
      email: user.email,
      name: user.fullName,
    },
  });
};

module.exports = { registerUser };
