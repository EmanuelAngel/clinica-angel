/* eslint-disable no-console */
import "dotenv/config";

import { prisma } from "../src/_shared/infrastructure/prisma.js";
import { healthInsurances } from "./seeders/health-insurances.seed.js";
import { users } from "./seeders/users.seed.js";
import { patients } from "./seeders/patients.seed.js";
import { specialties } from "./seeders/specialties.seed.js";
import { professionals } from "./seeders/professionals.seed.js";

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

  // Specialties
  await prisma.specialty.createMany({
    data: specialties,
    skipDuplicates: true,
  });

  // Professionals (Handle nested relations)
  for (const prof of professionals) {
    await prisma.user.upsert({
      where: { email: prof.email },
      update: {},
      create: prof,
    });
  }

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
