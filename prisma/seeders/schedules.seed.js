import { SlotsGeneratorService } from "../../src/schedules/domain/slots-generator.service.js";

/**
 * Seeds the database with 12 varied schedules.
 * @param {import("@prisma/client").PrismaClient} prisma
 */
export async function seedSchedules(prisma) {
  // 1. Get necessary data from DB (already seeded)
  const professionals = await prisma.professionalSpecialty.findMany({
    include: { specialty: true },
  });
  const locations = await prisma.location.findMany();
  const classifications = await prisma.classification.findMany();

  if (
    professionals.length < 6 ||
    locations.length < 3 ||
    classifications.length < 2
  ) {
    throw new Error("Insufficient prerequisite data to seed 12 schedules.");
  }

  // 2. Define schedule configurations
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 2); // 2 months validity

  const scheduleConfigs = [
    // 1. Nikolai - Kinesiología - Sede Central - Normal
    {
      license: "KN-935",
      locationId: locations[0].id,
      classificationId: classifications[0].id,
      duration: 30,
      weekly: [
        { day: "MONDAY", ranges: [{ start: "08:00", end: "12:00" }] },
        { day: "WEDNESDAY", ranges: [{ start: "14:00", end: "18:00" }] },
      ],
    },
    // 2. Nikolai - Pediatría - Sede Norte - Normal
    {
      license: "PI-115",
      locationId: locations[1].id,
      classificationId: classifications[0].id,
      duration: 20,
      weekly: [
        { day: "TUESDAY", ranges: [{ start: "09:00", end: "13:00" }] },
        { day: "THURSDAY", ranges: [{ start: "09:00", end: "13:00" }] },
      ],
    },
    // 3. Carla - Inmunología - Sede Sur - VIP
    {
      license: "IM-238172375",
      locationId: locations[2].id,
      classificationId: classifications[1].id,
      duration: 40,
      weekly: [{ day: "FRIDAY", ranges: [{ start: "10:00", end: "16:00" }] }],
    },
    // 4. Sofia - Cardiología - Sede Central - Normal
    {
      license: "CA-38214288",
      locationId: locations[0].id,
      classificationId: classifications[0].id,
      duration: 15,
      weekly: [
        {
          day: "MONDAY",
          ranges: [
            { start: "08:00", end: "11:00" },
            { start: "14:00", end: "17:00" },
          ],
        },
      ],
    },
    // 5. Takeo - Dermatología - Sede Norte - Normal
    {
      license: "DE-115",
      locationId: locations[1].id,
      classificationId: classifications[0].id,
      duration: 30,
      weekly: [
        { day: "WEDNESDAY", ranges: [{ start: "08:00", end: "14:00" }] },
      ],
    },
    // 6. Tank - Traumatología - Sede Sur - Normal
    {
      license: "TR-341",
      locationId: locations[2].id,
      classificationId: classifications[0].id,
      duration: 30,
      weekly: [{ day: "THURSDAY", ranges: [{ start: "14:00", end: "20:00" }] }],
    },
    // 7. Samantha - Psiquiatría - Sede Central - VIP
    {
      license: "PS-115",
      locationId: locations[0].id,
      classificationId: classifications[1].id,
      duration: 60,
      weekly: [{ day: "FRIDAY", ranges: [{ start: "08:00", end: "14:00" }] }],
    },
    // 8. Samantha - Neurología - Sede Norte - Normal
    {
      license: "NE-935",
      locationId: locations[1].id,
      classificationId: classifications[0].id,
      duration: 45,
      weekly: [{ day: "MONDAY", ranges: [{ start: "15:00", end: "19:00" }] }],
    },
    // 9. Sofia - Cardiología - Sede Norte - VIP
    {
      license: "CA-38214288",
      locationId: locations[1].id,
      classificationId: classifications[1].id,
      duration: 20,
      weekly: [{ day: "TUESDAY", ranges: [{ start: "15:00", end: "19:00" }] }],
    },
    // 10. Takeo - Dermatología - Sede Central - Normal
    {
      license: "DE-115",
      locationId: locations[0].id,
      classificationId: classifications[0].id,
      duration: 30,
      weekly: [{ day: "SATURDAY", ranges: [{ start: "09:00", end: "13:00" }] }],
    },
    // 11. Tank - Traumatología - Sede Norte - Normal
    {
      license: "TR-341",
      locationId: locations[1].id,
      classificationId: classifications[0].id,
      duration: 25,
      weekly: [{ day: "TUESDAY", ranges: [{ start: "10:00", end: "14:00" }] }],
    },
    // 12. Nikolai - Kinesiología - Sede Sur - VIP
    {
      license: "KN-935",
      locationId: locations[2].id,
      classificationId: classifications[1].id,
      duration: 30,
      weekly: [{ day: "THURSDAY", ranges: [{ start: "08:00", end: "12:00" }] }],
    },
  ];

  // 3. Seed each schedule
  for (const config of scheduleConfigs) {
    const generationResult = SlotsGeneratorService.generate({
      startDate,
      endDate,
      daysAndTimes: config.weekly,
      slotDurationMinutes: config.duration,
      blocks: [],
    });

    if (generationResult.isErr()) {
      console.error(
        `Failed to generate slots for license ${config.license}:`,
        generationResult.error
      );
      continue;
    }

    const slots = generationResult.value;

    await prisma.schedule.create({
      data: {
        professionalLicense: config.license,
        locationId: config.locationId,
        classificationId: config.classificationId,
        slotDuration: config.duration,
        configs: {
          create: config.weekly.flatMap((day) =>
            day.ranges.map((range) => ({
              dayOfWeek: day.day,
              startTime: range.start,
              endTime: range.end,
              validFrom: startDate,
              validUntil: endDate,
            }))
          ),
        },
        slots: {
          create: slots.map((slot) => ({
            startsAt: slot.startsAt,
            status: "FREE",
          })),
        },
      },
    });
  }
}
