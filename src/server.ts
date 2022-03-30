import express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { mysqlConfig, redisConfig } from "./connections/dbConfigs";
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 9090;
const redis = require("redis");
//const connection = require("./connections/mysql-connection");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.set("trust proxy", true);

// console.log(result);
(async () => {
  try {
    console.log(mysqlConfig);
    const mysqlConnection = await createConnection(mysqlConfig);
    console.log(mysqlConnection.migrations);
    await mysqlConnection.runMigrations();
    const redisConnection = await redis.createClient(redisConfig.url);
    //console.log(redisConnection);
    //app.locals.mysqlDB = mysqlConnection;
    app.locals.redisDB = redisConnection;
  } catch (error) {
    console.log("Error while connecting to the database", error);
    return error;
  }

  const userRouter = require("./routes/user-route");
  app.use("/api/users", userRouter);

  const otpRouter = require("./routes/auth/otp-route");
  app.use("/api/otps", otpRouter);

  app.listen(port, () => {
    console.log("Server running on port: ", port);
  });

  app.use(formatAndSendReponse);
  function formatAndSendReponse(req: any, res: any) {
    console.log(req.responseProperties);
    res.end(JSON.stringify(req.responseProperties));
  }
})();

export { app };
