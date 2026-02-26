import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { SlotStatus } from "../../schedules/domain/slot-status.js";

describe("Overbook integration", () => {
  let adminToken;
  let secretaryToken;
  let patientToken;

  let schedule;
  let patient;
  let patient2;

  beforeEach(async () => {
    const specialty = await prisma.specialty.create({
      data: { name: "Cardiología" },
    });

    const professional = await prisma.user.create({
      data: {
        email: "doctor@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dr. Juan",
        lastNames: "Pérez",
        nationalId: "30000001",
        phone: "1111111111",
        address: "Calle Médico 123",
      },
    });

    await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP1234",
        userId: professional.id,
        specialtyId: specialty.id,
      },
    });

    const location = await prisma.location.create({
      data: { name: "Consultorio A", address: "Av. Principal 100" },
    });

    const classification = await prisma.classification.create({
      data: { name: "Consulta General" },
    });

    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: "MP1234",
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 30,
        maxOverbooksPerSlot: 1,
        maxOverbooksPerDay: 2,
      },
    });

    patient = await prisma.user.create({
      data: {
        email: "patient@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "María",
        lastNames: "García",
        nationalId: "40000001",
        phone: "2222222222",
        address: "Calle Paciente 456",
      },
    });

    patient2 = await prisma.user.create({
      data: {
        email: "patient2@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Carlos",
        lastNames: "López",
        nationalId: "40000002",
        phone: "2222222223",
        address: "Calle Paciente 789",
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: "hashed",
        role: Roles.ADMIN,
        firstNames: "Admin",
        lastNames: "User",
        nationalId: "50000001",
        phone: "3333333333",
        address: "Calle Admin 789",
      },
    });

    const secretary = await prisma.user.create({
      data: {
        email: "secretary@example.com",
        passwordHash: "hashed",
        role: Roles.SECRETARY,
        firstNames: "Secretary",
        lastNames: "User",
        nationalId: "50000002",
        phone: "4444444444",
        address: "Calle Secretary 789",
      },
    });

    adminToken = generateToken({ sub: admin.id, role: Roles.ADMIN });
    secretaryToken = generateToken({
      sub: secretary.id,
      role: Roles.SECRETARY,
    });
    patientToken = generateToken({ sub: patient.id, role: Roles.PATIENT });
  });

  /**
   * Helper to create a PROPOSED slot 3 days in the future.
   */
  async function createProposedSlot(overrides = {}) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setMinutes(0, 0, 0);

    return prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        startsAt: futureDate,
        status: SlotStatus.PROPOSED,
        patientId: patient.id,
        consultationReason: "Control de rutina",
        ...overrides,
      },
    });
  }

  test("SECRETARY creates overbook from a PROPOSED slot", async () => {
    const slot = await createProposedSlot();

    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        patientId: patient2.id,
        consultationReason: "Consulta urgente",
      });

    expect(response.status).toBe(201);
    expect(response.body.overbookSlotId).toBeDefined();

    const overbook = await prisma.slot.findUnique({
      where: { id: response.body.overbookSlotId },
    });
    expect(overbook).not.toBeNull();
    expect(overbook?.isOverbook).toBe(true);
    expect(overbook?.status).toBe(SlotStatus.BOOKED);
    expect(overbook?.scheduleId).toBe(slot.scheduleId);
    expect(overbook?.startsAt.getTime()).toBe(slot.startsAt.getTime());
    expect(overbook?.patientId).toBe(patient2.id);
  });

  test("ADMIN creates overbook from a PROPOSED slot", async () => {
    const slot = await createProposedSlot();

    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        patientId: patient2.id,
        consultationReason: "Consulta urgente admin",
      });

    expect(response.status).toBe(201);
    expect(response.body.overbookSlotId).toBeDefined();
  });

  test("rejects when source slot is not PROPOSED (FREE)", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const slot = await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        startsAt: futureDate,
        status: SlotStatus.FREE,
      },
    });

    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        patientId: patient.id,
        consultationReason: "Intentar sobreturno",
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain("Propuesto");
  });

  test("rejects when maxOverbooksPerSlot limit is reached", async () => {
    const slot = await createProposedSlot();

    // Create the first overbook (limit is 1)
    await prisma.slot.create({
      data: {
        scheduleId: slot.scheduleId,
        startsAt: slot.startsAt,
        status: SlotStatus.BOOKED,
        isOverbook: true,
        patientId: patient2.id,
        consultationReason: "First overbook",
      },
    });

    // Attempt a second overbook at the same time
    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        patientId: patient.id,
        consultationReason: "Should fail per slot",
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain("horario");
  });

  test("rejects when maxOverbooksPerDay limit is reached", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(10, 0, 0, 0);

    const slot1 = await createProposedSlot({ startsAt: futureDate });

    // Create two overbooks at different times on the same day (limit is 2/day)
    await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        startsAt: futureDate,
        status: SlotStatus.BOOKED,
        isOverbook: true,
        patientId: patient2.id,
        consultationReason: "Overbook 1",
      },
    });

    const futureDate2 = new Date(futureDate);
    futureDate2.setHours(11, 0, 0, 0);

    const slot2 = await createProposedSlot({ startsAt: futureDate2 });

    await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        startsAt: futureDate2,
        status: SlotStatus.BOOKED,
        isOverbook: true,
        patientId: patient2.id,
        consultationReason: "Overbook 2",
      },
    });

    // Third overbook at a third time on the same day
    const futureDate3 = new Date(futureDate);
    futureDate3.setHours(12, 0, 0, 0);

    const slot3 = await createProposedSlot({ startsAt: futureDate3 });

    const response = await request(app)
      .post(`/api/v1/slots/${slot3.id}/overbook`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        patientId: patient.id,
        consultationReason: "Should fail per day",
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain("día");
  });

  test("rejects without valid consultationReason", async () => {
    const slot = await createProposedSlot();

    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        patientId: patient2.id,
        consultationReason: "abc",
      });

    expect(response.status).toBe(422);
  });

  test("rejects when user role is PATIENT", async () => {
    const slot = await createProposedSlot();

    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${patientToken}`)
      .send({
        patientId: patient.id,
        consultationReason: "Sobreturno paciente",
      });

    expect(response.status).toBe(403);
  });

  test("cancelling an overbook frees quota for new ones", async () => {
    const slot = await createProposedSlot();

    // Create overbook (limit is 1 per slot)
    const existingOverbook = await prisma.slot.create({
      data: {
        scheduleId: slot.scheduleId,
        startsAt: slot.startsAt,
        status: SlotStatus.BOOKED,
        isOverbook: true,
        patientId: patient2.id,
        consultationReason: "Will be cancelled",
      },
    });

    // Cancel it
    await prisma.slot.update({
      where: { id: existingOverbook.id },
      data: { status: SlotStatus.CANCELLED },
    });

    // Now we should be able to create a new one
    const response = await request(app)
      .post(`/api/v1/slots/${slot.id}/overbook`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send({
        patientId: patient.id,
        consultationReason: "After cancel overbook",
      });

    expect(response.status).toBe(201);
  });
});
