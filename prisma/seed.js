/* eslint-disable no-console */
import { PrismaClient } from "../generated/prisma/client.js";
import { users } from "./seeders/users.seed.js";

const prisma = new PrismaClient();

/**
 * Seeds the database with initial data.
 */
async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log("✨ Seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
