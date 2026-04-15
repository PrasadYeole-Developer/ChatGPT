require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/DB/db");
const initSocketServer = require("./src/sockets/socket.server");
const httpServer = require("http").createServer(app);

connectToDB();
initSocketServer(httpServer);

httpServer.listen(process.env.PORT, () => {
  console.log(`Server started running on ${process.env.PORT}`);
});
