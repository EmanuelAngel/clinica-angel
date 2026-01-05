/* eslint-disable no-console */
import "dotenv/config";

import { prisma } from "../src/_shared/infrastructure/prisma.js";
import { healthInsurances } from "./seeders/health-insurances.seed.js";
import { users } from "./seeders/users.seed.js";
import { patients } from "./seeders/patients.seed.js";

/**
 * Seeds the database with initial data.
 */
async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  await prisma.healthInsurance.createMany({
    data: healthInsurances,
    skipDuplicates: true,
  });

  // Patients
  await prisma.user.createMany({
    data: patients,
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
