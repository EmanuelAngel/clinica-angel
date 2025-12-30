import prisma, { cleanDatabase } from "./setup.js";

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
