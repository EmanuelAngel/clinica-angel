import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Schedule configuration update (PATCH /schedules/:id)", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });
  const secretaryToken = generateToken({ sub: 998, role: Roles.SECRETARY });
  const patientToken = generateToken({ sub: 997, role: Roles.PATIENT });

  /** @type {any} */
  let schedule;

  beforeEach(async () => {
    const specialty = await prisma.specialty.create({
      data: { name: "Update Test Specialty" },
    });

    const profUser = await prisma.user.create({
      data: {
        email: "update-prof@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dr. Update",
        lastNames: "Test",
        nationalId: "UPDATE-PROF-1",
        phone: "1111111111",
        address: "Update Street 1",
      },
    });

    const profSpecialty = await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP-UPDATE-TEST",
        userId: profUser.id,
        specialtyId: specialty.id,
      },
    });

    const location = await prisma.location.create({
      data: { name: "Update Clinic", address: "Update Address" },
    });

    const classification = await prisma.classification.create({
      data: { name: "Update Consultation" },
    });

    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: profSpecialty.licenseNumber,
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 20,
        maxOverbooksPerDay: 5,
        maxOverbooksPerSlot: 1,
        isPaused: false,
      },
    });
  });

  afterEach(async () => {
    await prisma.slot.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.professionalSpecialty.deleteMany({});
    await prisma.classification.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ["update-prof@example.com"] },
      },
    });
    await prisma.specialty.deleteMany({
      where: { name: "Update Test Specialty" },
    });
  });

  test("ADMIN can update schedule configuration", async () => {
    const res = await request(app)
      .patch(`/schedules/${schedule.id}`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        maxOverbooksPerDay: 10,
        maxOverbooksPerSlot: 2,
        isPaused: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Configuración de agenda actualizada");

    const updatedSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
    });
    expect(updatedSchedule.maxOverbooksPerDay).toBe(10);
    expect(updatedSchedule.maxOverbooksPerSlot).toBe(2);
    expect(updatedSchedule.isPaused).toBe(true);
  });

  test("SECRETARY cannot update schedule configuration", async () => {
    const res = await request(app)
      .patch(`/schedules/${schedule.id}`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        maxOverbooksPerDay: 8,
      });

    expect([401, 302, 403]).toContain(res.status);
  });

  test("PATIENT cannot update schedule configuration", async () => {
    const res = await request(app)
      .patch(`/schedules/${schedule.id}`)
      .set("Cookie", `access_token=${patientToken}`)
      .send({
        maxOverbooksPerDay: 10,
      });

    expect([401, 302, 403]).toContain(res.status);
  });

  test("returns 422 for invalid data (negative values)", async () => {
    const res = await request(app)
      .patch(`/schedules/${schedule.id}`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        maxOverbooksPerDay: -1,
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty("maxOverbooksPerDay");
  });

  test("returns 404 for non-existent schedule", async () => {
    const res = await request(app)
      .patch("/schedules/999999")
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        maxOverbooksPerDay: 10,
      });

    expect(res.status).toBe(404);
  });
});
