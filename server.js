require("dotenv").config();
const app = require("./src/app");

app.listen(process.env.PORT, () => {
    console.log(`Server started running on ${process.env.PORT}`);
});