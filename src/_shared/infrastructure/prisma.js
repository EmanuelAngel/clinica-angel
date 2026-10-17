import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../generated/prisma/client.js";

import { env } from "./env-variables.js";

const adapter = new PrismaMariaDb({
  host: env.MYSQL_DATABASE_HOST,
  port: env.MYSQL_DATABASE_PORT,
  user: env.MYSQL_DATABASE_USER,
  password: env.MYSQL_DATABASE_PASSWORD,
  database: env.MYSQL_DATABASE_NAME,
  connectionLimit: env.MYSQL_DATABASE_CONNECTION_LIMIT,
  ...(env.MYSQL_DATABASE_SSL ? { ssl: { rejectUnauthorized: true } } : {}),
});

const prisma = new PrismaClient({ adapter });

export { prisma };
