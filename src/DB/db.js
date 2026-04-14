const { mongoose } = require("mongoose");
require("dotenv").config();

const connectToDB = () => {
  try {
    mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB!");
  } catch (err) {
    console.log("Error connecting to DB: ", err);
  }
};

module.exports = connectToDB;