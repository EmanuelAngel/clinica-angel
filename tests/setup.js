import dotenv from "dotenv";
import { prisma } from "../src/_shared/infrastructure/prisma.js";

dotenv.config({ path: ".env.test" });

export const cleanDatabase = async () => {
  const tablenames = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'clinica_angel_test'
  `;

  for (const { table_name } of tablenames) {
    if (table_name !== "_prisma_migrations") {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table_name};`);
      } catch {
        await prisma.$executeRawUnsafe(`DELETE FROM ${table_name};`);
      }
    }
  }
};

export default prisma;
