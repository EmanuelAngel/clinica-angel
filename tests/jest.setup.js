import { prisma } from "../src/_shared/infrastructure/prisma.js";
import { cleanDatabase } from "./setup.js";

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
