import "dotenv/config";
import { prisma } from "./src/_shared/infrastructure/prisma.js";

/**
 *
 */
async function main() {
  const counts = await prisma.slot.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  console.log("Slot counts by status:");
  console.log(JSON.stringify(counts, null, 2));

  const needsReschedule = await prisma.slot.findMany({
    where: { status: "NEEDS_RESCHEDULE" },
    take: 5,
    include: {
      patient: true,
      schedule: true,
    },
  });

  console.log(
    "\nSample NEEDS_RESCHEDULE slots (count: " + needsReschedule.length + "):"
  );
  console.log(JSON.stringify(needsReschedule, null, 2));

  const blocks = await prisma.scheduleBlock.findMany({
    take: 10,
  });

  console.log("\nSchedule blocks (count: " + blocks.length + "):");
  console.log(JSON.stringify(blocks, null, 2));

  const allOccupied = await prisma.slot.findMany({
    where: { status: { in: ["PROPOSED", "BOOKED"] } },
    include: {
      schedule: { include: { professional: { include: { user: true } } } },
    },
  });

  console.log("\nALL occupied slots in database (" + allOccupied.length + "):");
  allOccupied.forEach((s) => {
    console.log(
      `- Schedule ID ${s.scheduleId} (${s.schedule.professional.user.lastNames}): ${s.startsAt.toISOString()} [${s.status}]`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
