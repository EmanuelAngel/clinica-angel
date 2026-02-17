import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { SlotStatus } from "../../schedules/domain/slot-status.js";

describe("Slot actions integration", () => {
  let adminToken;
  let secretaryToken;
  let patientToken;

  let schedule;
  let patient;

  beforeEach(async () => {
    // Create a professional for the schedule
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
      },
    });

    // Create a patient user
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

    // Create admin user
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

    // Create secretary user
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

  describe("reserve", () => {
    test("updates slot from FREE to PROPOSED when SECRETARY reserves", async () => {
      // Create a slot 3 days in the future
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
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .send({
          patientId: patient.id,
          consultationReason: "Control anual de rutina",
        });

      expect(response.status).toBe(200);

      const updated = await prisma.slot.findUnique({ where: { id: slot.id } });
      expect(updated?.status).toBe(SlotStatus.PROPOSED);
      expect(updated?.patientId).toBe(patient.id);
      expect(updated?.consultationReason).toBe("Control anual de rutina");
    });

    test("requires 48h lead time for PATIENT reservations", async () => {
      // Create a slot 24 hours in the future (less than 48h)
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 24);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.FREE,
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${patientToken}`)
        .send({
          consultationReason: "Control de presión",
        });

      expect(response.status).toBe(422);
      expect(response.body.message).toContain("48h");
    });

    test("PATIENT can reserve slot with 48h+ lead time", async () => {
      // Create a slot 72 hours in the future
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 72);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.FREE,
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${patientToken}`)
        .send({
          consultationReason: "Chequeo general",
        });

      expect(response.status).toBe(200);

      const updated = await prisma.slot.findUnique({ where: { id: slot.id } });
      expect(updated?.status).toBe(SlotStatus.PROPOSED);
      expect(updated?.patientId).toBe(patient.id);
    });

    test("requires consultationReason with min 5 chars", async () => {
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
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .send({
          patientId: patient.id,
          consultationReason: "abc",
        });

      expect(response.status).toBe(422);
    });

    test("fails when slot is not FREE", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.BOOKED,
          patientId: patient.id,
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .send({
          patientId: patient.id,
          consultationReason: "Another reason",
        });

      expect(response.status).toBe(422);
    });
  });

  describe("confirm", () => {
    test("updates slot from PROPOSED to BOOKED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.PROPOSED,
          patientId: patient.id,
          consultationReason: "Control routine",
        },
      });

      const response = await request(app)
        .patch(`/api/v1/slots/${slot.id}/confirm`)
        .set("Cookie", `access_token=${secretaryToken}`);

      expect(response.status).toBe(200);

      const updated = await prisma.slot.findUnique({ where: { id: slot.id } });
      expect(updated?.status).toBe(SlotStatus.BOOKED);
    });

    test("fails from wrong status (FREE)", async () => {
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
        .patch(`/api/v1/slots/${slot.id}/confirm`)
        .set("Cookie", `access_token=${secretaryToken}`);

      expect(response.status).toBe(422);
    });
  });

  describe("release", () => {
    test("clears patientId and consultationReason", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.PROPOSED,
          patientId: patient.id,
          consultationReason: "To be released",
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/release`)
        .set("Cookie", `access_token=${secretaryToken}`);

      expect(response.status).toBe(200);

      const updated = await prisma.slot.findUnique({ where: { id: slot.id } });
      expect(updated?.status).toBe(SlotStatus.FREE);
      expect(updated?.patientId).toBeNull();
      expect(updated?.consultationReason).toBeNull();
    });

    test("fails on FULFILLED slot", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: pastDate,
          status: SlotStatus.FULFILLED,
          patientId: patient.id,
          consultationReason: "Completed",
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/release`)
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(422);
    });
  });

  describe("past slot modifications", () => {
    test("SECRETARY cannot modify past slots", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: pastDate,
          status: SlotStatus.FREE,
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .send({
          patientId: patient.id,
          consultationReason: "Late booking",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("administradores");
    });

    test("ADMIN can modify past slots", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: pastDate,
          status: SlotStatus.FREE,
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          patientId: patient.id,
          consultationReason: "Late booking by admin",
        });

      expect(response.status).toBe(200);
    });
  });

  describe("PATIENT restrictions", () => {
    test("PATIENT cannot cancel a slot", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.PROPOSED,
          patientId: patient.id,
          consultationReason: "Test",
        },
      });

      const response = await request(app)
        .patch(`/api/v1/slots/${slot.id}/cancel`)
        .set("Cookie", `access_token=${patientToken}`);

      expect(response.status).toBe(403);
    });

    test("PATIENT cannot release a slot", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.PROPOSED,
          patientId: patient.id,
          consultationReason: "Test",
        },
      });

      const response = await request(app)
        .post(`/api/v1/slots/${slot.id}/release`)
        .set("Cookie", `access_token=${patientToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("full lifecycle happy path", () => {
    test("FREE → PROPOSED → BOOKED → ARRIVED → IN_PROGRESS → FULFILLED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const slot = await prisma.slot.create({
        data: {
          scheduleId: schedule.id,
          startsAt: futureDate,
          status: SlotStatus.FREE,
        },
      });

      // Reserve
      await request(app)
        .post(`/api/v1/slots/${slot.id}/reserve`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .send({
          patientId: patient.id,
          consultationReason: "Full lifecycle test",
        })
        .expect(200);

      // Confirm
      await request(app)
        .patch(`/api/v1/slots/${slot.id}/confirm`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .expect(200);

      // Arrive
      await request(app)
        .patch(`/api/v1/slots/${slot.id}/arrive`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .expect(200);

      // Start consultation
      await request(app)
        .patch(`/api/v1/slots/${slot.id}/start`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .expect(200);

      // Fulfill
      await request(app)
        .patch(`/api/v1/slots/${slot.id}/fulfill`)
        .set("Cookie", `access_token=${secretaryToken}`)
        .expect(200);

      // Verify final state
      const finalSlot = await prisma.slot.findUnique({
        where: { id: slot.id },
      });
      expect(finalSlot?.status).toBe(SlotStatus.FULFILLED);

      // Cannot release FULFILLED slot
      const releaseResponse = await request(app)
        .post(`/api/v1/slots/${slot.id}/release`)
        .set("Cookie", `access_token=${adminToken}`);

      expect(releaseResponse.status).toBe(422);
    });
  });
});
