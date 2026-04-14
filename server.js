require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/DB/db");

connectToDB();

app.listen(process.env.PORT, () => {
    console.log(`Server started running on ${process.env.PORT}`);
});