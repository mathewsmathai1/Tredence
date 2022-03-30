import path from "path";
import "reflect-metadata";
require("dotenv").config();

export const mysqlConfig: any = {
  name: "mysqlDB",
  type: "mysql",
  url: process.env.MYSQL_URI,
  entities: [path.join(__dirname, "../entity/**/*.js")],
  migrations: [path.join(__dirname, "../migration/*.js")],
  migrationsRun: true,
  migrationsTableName: "migrations",
};

export const redisConfig: any = {
  name: "redisDB",
  type: "redis",
  url: process.env.REDIS_URL,
};
