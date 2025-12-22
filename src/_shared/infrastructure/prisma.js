import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../generated/prisma/client.js";

import { env } from "./env-variables.js";

const adapter = new PrismaMariaDb({
  host: env.MYSQL_DATABASE_HOST,
  user: env.MYSQL_DATABASE_USER,
  password: env.MYSQL_DATABASE_PASSWORD,
  database: env.MYSQL_DATABASE_NAME,
  connectionLimit: env.MYSQL_DATABASE_CONNECTION_LIMIT,
});

const prisma = new PrismaClient({ adapter });

export { prisma };
