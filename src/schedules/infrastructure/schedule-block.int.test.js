import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Schedule block registration (POST /schedules/:id/blocks)", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });
  const patientToken = generateToken({ sub: 998, role: Roles.PATIENT });

  /** @type {any} */
  let schedule;
  /** @type {any} */
  let patientUser;

  beforeEach(async () => {
    const specialty = await prisma.specialty.create({
      data: { name: "Block Test Specialty" },
    });

    const profUser = await prisma.user.create({
      data: {
        email: "block-prof@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dr. Block",
        lastNames: "Test",
        nationalId: "BLOCK-PROF-1",
        phone: "1111111111",
        address: "Block Street 1",
      },
    });

    patientUser = await prisma.user.create({
      data: {
        email: "block-patient@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Block",
        lastNames: "Patient",
        nationalId: "BLOCK-PAT-1",
        phone: "2222222222",
        address: "Patient Street 1",
      },
    });

    const profSpecialty = await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP-BLOCK-TEST",
        userId: profUser.id,
        specialtyId: specialty.id,
      },
    });

    const location = await prisma.location.create({
      data: { name: "Block Clinic", address: "Block Address" },
    });

    const classification = await prisma.classification.create({
      data: { name: "Block Consultation" },
    });

    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: profSpecialty.licenseNumber,
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 20,
      },
    });

    // Create slots: 3 FREE, 1 PROPOSED, 1 BOOKED within the block range
    const baseDate = new Date(2026, 5, 15); // June 15, 2026

    await prisma.slot.createMany({
      data: [
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 15, 9, 0),
          status: "FREE",
        },
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 15, 10, 0),
          status: "FREE",
        },
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 16, 9, 0),
          status: "FREE",
        },
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 15, 11, 0),
          status: "PROPOSED",
          patientId: patientUser.id,
          consultationReason: "Control anual",
        },
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 16, 10, 0),
          status: "BOOKED",
          patientId: patientUser.id,
          consultationReason: "Dolor de cabeza",
        },
        // Slot outside of range — should be unaffected
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 20, 9, 0),
          status: "FREE",
        },
        // Overbook within range
        {
          scheduleId: schedule.id,
          startsAt: new Date(2026, 5, 15, 11, 0),
          status: "PROPOSED",
          patientId: patientUser.id,
          consultationReason: "Sobreturno urgente",
          isOverbook: true,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.slot.deleteMany({});
    await prisma.scheduleBlock.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.professionalSpecialty.deleteMany({});
    await prisma.classification.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ["block-prof@example.com", "block-patient@example.com"] },
      },
    });
    await prisma.specialty.deleteMany({
      where: { name: "Block Test Specialty" },
    });
  });

  test("creates block, deletes FREE slots, and marks PROPOSED/BOOKED as NEEDS_RESCHEDULE", async () => {
    const res = await request(app)
      .post(`/schedules/${schedule.id}/blocks`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: "2026-06-15",
        endDate: "2026-06-16",
        reason: "Enfermedad del profesional",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Bloqueo registrado");
    expect(res.body.deletedFree).toBe(3);
    expect(res.body.markedReschedule).toBe(3); // 1 PROPOSED + 1 BOOKED + 1 overbook

    // Verify block was created
    const blocks = await prisma.scheduleBlock.findMany({
      where: { scheduleId: schedule.id },
    });
    expect(blocks.length).toBe(1);
    expect(blocks[0].reason).toBe("Enfermedad del profesional");

    // Verify affected slots
    const remainingSlots = await prisma.slot.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { startsAt: "asc" },
    });

    // 3 FREE deleted, 3 NEEDS_RESCHEDULE remain, plus 1 outside range
    expect(remainingSlots.length).toBe(4);

    const rescheduleSlots = remainingSlots.filter(
      (s) => s.status === "NEEDS_RESCHEDULE"
    );
    expect(rescheduleSlots.length).toBe(3);

    // Slot outside range should remain FREE
    const outsideSlot = remainingSlots.find((s) => s.startsAt.getDate() === 20);
    expect(outsideSlot.status).toBe("FREE");
  });

  test("returns 404 for non-existent schedule", async () => {
    const res = await request(app)
      .post("/schedules/999999/blocks")
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: "2026-06-15",
        endDate: "2026-06-16",
        reason: "Test reason",
      });

    expect(res.status).toBe(404);
  });

  test("returns 422 for invalid data", async () => {
    const res = await request(app)
      .post(`/schedules/${schedule.id}/blocks`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: "invalid",
        endDate: "2026-06-16",
        reason: "ab",
      });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Datos inválidos");
  });

  test("returns 401/302 for unauthenticated users", async () => {
    const res = await request(app)
      .post(`/schedules/${schedule.id}/blocks`)
      .send({
        startDate: "2026-06-15",
        endDate: "2026-06-16",
        reason: "Test reason",
      });

    expect([401, 302]).toContain(res.status);
  });

  test("returns 403 for non-admin users", async () => {
    const res = await request(app)
      .post(`/schedules/${schedule.id}/blocks`)
      .set("Cookie", `access_token=${patientToken}`)
      .send({
        startDate: "2026-06-15",
        endDate: "2026-06-16",
        reason: "Test reason",
      });

    expect([401, 302, 403]).toContain(res.status);
  });
});

describe("Reschedule inbox (GET /schedules/reschedule)", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });
  const patientToken = generateToken({ sub: 998, role: Roles.PATIENT });

  /** @type {any} */
  let schedule;

  beforeEach(async () => {
    const specialty = await prisma.specialty.create({
      data: { name: "Inbox Test Specialty" },
    });

    const profUser = await prisma.user.create({
      data: {
        email: "inbox-prof@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dr. Inbox",
        lastNames: "Test",
        nationalId: "INBOX-PROF-1",
        phone: "3333333333",
        address: "Inbox Street 1",
      },
    });

    const patientUser = await prisma.user.create({
      data: {
        email: "inbox-patient@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Inbox",
        lastNames: "Patient",
        nationalId: "INBOX-PAT-1",
        phone: "4444444444",
        address: "Inbox Patient Street",
      },
    });

    const profSpecialty = await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP-INBOX-TEST",
        userId: profUser.id,
        specialtyId: specialty.id,
      },
    });

    const location = await prisma.location.create({
      data: { name: "Inbox Clinic", address: "Inbox Address" },
    });

    const classification = await prisma.classification.create({
      data: { name: "Inbox Consultation" },
    });

    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: profSpecialty.licenseNumber,
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 30,
      },
    });

    // Create a NEEDS_RESCHEDULE slot
    await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        startsAt: new Date(2026, 5, 15, 10, 0),
        status: "NEEDS_RESCHEDULE",
        patientId: patientUser.id,
        consultationReason: "Control programado",
      },
    });
  });

  afterEach(async () => {
    await prisma.slot.deleteMany({});
    await prisma.scheduleBlock.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.professionalSpecialty.deleteMany({});
    await prisma.classification.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["inbox-prof@example.com", "inbox-patient@example.com"],
        },
      },
    });
    await prisma.specialty.deleteMany({
      where: { name: "Inbox Test Specialty" },
    });
  });

  test("renders reschedule inbox with patient details", async () => {
    const res = await request(app)
      .get("/schedules/reschedule")
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Bandeja de Reasignación");
    expect(res.text).toContain("Inbox Patient");
    expect(res.text).toContain("4444444444");
    expect(res.text).toContain("inbox-patient@example.com");
    expect(res.text).toContain("Control programado");
  });

  test("renders empty state when no slots need rescheduling", async () => {
    await prisma.slot.deleteMany({});

    const res = await request(app)
      .get("/schedules/reschedule")
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Sin turnos pendientes");
  });

  test("returns 401/302 for unauthenticated users", async () => {
    const res = await request(app).get("/schedules/reschedule");
    expect([401, 302]).toContain(res.status);
  });

  test("returns 401/302/403 for non-admin/non-secretary users", async () => {
    const res = await request(app)
      .get("/schedules/reschedule")
      .set("Cookie", `access_token=${patientToken}`);
    expect([401, 302, 403]).toContain(res.status);
  });
});
