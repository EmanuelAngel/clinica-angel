/* eslint-disable no-console */

import { prisma } from "./_shared/infrastructure/prisma.js";

/** Check Prisma state. */
async function main() {
  const location = await prisma.location.create({
    data: {
      name: "Benavides",
      address: "Calle de la Paz, 1",
    },
  });

  console.log("Created location: ", location);

  const allLocations = await prisma.location.findMany({
    include: {
      schedules: true,
    },
  });

  console.log(
    "All locations with schedules:",
    JSON.stringify(allLocations, null, 2)
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
