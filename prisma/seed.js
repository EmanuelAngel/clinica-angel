/* eslint-disable no-console */
import { prisma } from "../src/_shared/infrastructure/prisma.js";
import { users } from "./seeders/users.seed.js";

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
