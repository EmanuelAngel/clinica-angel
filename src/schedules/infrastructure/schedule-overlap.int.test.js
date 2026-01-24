import request from "supertest";
import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("Schedule Overlap Integration Tests", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  test("should detect overlap between different licenses of the same professional", async () => {
    // 1. Setup Data Inside Test for isolation
    const ts = Date.now();
    const pediatricSpecialty = await prisma.specialty.create({
      data: { name: "Pediatría Overlap " + ts },
    });
    const cardiologySpecialty = await prisma.specialty.create({
      data: { name: "Cardiología Overlap " + ts },
    });
    const location = await prisma.location.create({
      data: { name: "Consultorio Overlap " + ts, address: "Calle 123" },
    });
    const classification = await prisma.classification.create({
      data: { name: "Consulta Overlap " + ts },
    });

    const proUser = await prisma.user.create({
      data: {
        email: `pepe-${ts}@example.com`,
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Pepe",
        lastNames: "Overlap",
        nationalId: "ID-" + ts,
        phone: "123456",
        address: "Calle Falsa 123",
      },
    });

    const licPed = "LIC-PED-" + ts;
    const licCard = "LIC-CARD-" + ts;

    await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: licPed,
        userId: proUser.id,
        specialtyId: pediatricSpecialty.id,
      },
    });

    await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: licCard,
        userId: proUser.id,
        specialtyId: cardiologySpecialty.id,
      },
    });

    // 2. Create first schedule (Pediatría, Monday 08:00-12:00)
    const firstSchedulePayload = {
      schedule: {
        licenseNumber: licPed,
        locationId: location.id,
        classificationId: classification.id,
        slotDurationMinutes: 20,
        maxOverbooksPerDay: 0,
        maxOverbooksPerSlot: 0,
      },
      config: {
        validity: {
          from: "2026-02-01",
          to: "2026-03-01",
        },
        weeklyDays: [
          {
            day: "MONDAY",
            ranges: [{ start: "08:00", end: "12:00" }],
          },
        ],
      },
    };

    const firstRes = await request(app)
      .post("/schedules")
      .set("Cookie", `access_token=${adminToken}`)
      .send(firstSchedulePayload);

    expect(firstRes.status).toBe(302); // Redirect to list on success

    // 3. Attempt to create second schedule (Cardiología, Monday 11:00-13:00) -> OVERLAP!
    const secondSchedulePayload = {
      schedule: {
        licenseNumber: licCard,
        locationId: location.id,
        classificationId: classification.id,
        slotDurationMinutes: 20,
        maxOverbooksPerDay: 0,
        maxOverbooksPerSlot: 0,
      },
      config: {
        validity: {
          from: "2026-02-01",
          to: "2026-03-01",
        },
        weeklyDays: [
          {
            day: "MONDAY",
            ranges: [{ start: "11:00", end: "13:00" }],
          },
        ],
      },
    };

    const secondRes = await request(app)
      .post("/schedules")
      .set("Cookie", `access_token=${adminToken}`)
      .send(secondSchedulePayload);

    // CURRENT STATE: This should FAIL (status 302 instead of 409) without the fix
    // DESIRED STATE: status 409 (Conflict)
    expect(secondRes.status).toBe(409);
    expect(secondRes.text).toContain("solapa");
  });
});
