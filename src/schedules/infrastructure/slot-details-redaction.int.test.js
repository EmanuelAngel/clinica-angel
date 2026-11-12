import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { SlotStatus } from "../../schedules/domain/slot-status.js";

/**
 * Slot details feed the booking modal. Contact data must never reach a patient
 * who is not the owner of the slot, and the owner must see their own data
 * instead of "REDACTED": after booking, the modal refreshes this same endpoint
 * and would otherwise show the patient their own record as redacted.
 */
describe("Slot details redaction (GET /schedules/slots/:id)", () => {
  const owner = {
    email: "ana.owner@example.com",
    phone: "2222-3333",
    address: "San Martín 100",
    nationalId: "41111111",
  };
  const other = {
    email: "bruno.other@example.com",
    phone: "4444-5555",
    address: "Belgrano 200",
    nationalId: "42222222",
  };

  let ownerToken;
  let adminToken;
  let secretaryToken;
  let ownerSlot;
  let otherSlot;

  const cookie = (token) => `access_token=${token}`;

  beforeEach(async () => {
    const specialty = await prisma.specialty.create({
      data: { name: "Clínica Médica" },
    });

    const professional = await prisma.user.create({
      data: {
        email: "medico.redaccion@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dr. Hugo",
        lastNames: "Médico",
        nationalId: "30000009",
        phone: "1111111111",
        address: "Consultorio 1",
      },
    });

    await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP9999",
        userId: professional.id,
        specialtyId: specialty.id,
      },
    });

    const location = await prisma.location.create({
      data: { name: "Sede Centro", address: "Av. Siempre Viva 1" },
    });

    const classification = await prisma.classification.create({
      data: { name: "Primera consulta" },
    });

    const schedule = await prisma.schedule.create({
      data: {
        professionalLicense: "MP9999",
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 30,
      },
    });

    const ownerUser = await prisma.user.create({
      data: {
        email: owner.email,
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Ana",
        lastNames: "Dueña",
        nationalId: owner.nationalId,
        phone: owner.phone,
        address: owner.address,
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: other.email,
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Bruno",
        lastNames: "Ajeno",
        nationalId: other.nationalId,
        phone: other.phone,
        address: other.address,
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: "admin.redaccion@example.com",
        passwordHash: "hashed",
        role: Roles.ADMIN,
        firstNames: "Ada",
        lastNames: "Admin",
        nationalId: "10000001",
        phone: "1000000001",
        address: "Oficina 1",
      },
    });

    const secretary = await prisma.user.create({
      data: {
        email: "secretaria.redaccion@example.com",
        passwordHash: "hashed",
        role: Roles.SECRETARY,
        firstNames: "Sofía",
        lastNames: "Secretaria",
        nationalId: "10000002",
        phone: "1000000002",
        address: "Oficina 2",
      },
    });

    ownerSlot = await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        patientId: ownerUser.id,
        startsAt: new Date("2030-06-10T13:00:00.000Z"),
        status: SlotStatus.BOOKED,
        consultationReason: "Control",
      },
    });

    otherSlot = await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        patientId: otherUser.id,
        startsAt: new Date("2030-06-10T13:30:00.000Z"),
        status: SlotStatus.BOOKED,
        consultationReason: "Control",
      },
    });

    ownerToken = generateToken({ sub: ownerUser.id, role: Roles.PATIENT });
    adminToken = generateToken({ sub: admin.id, role: Roles.ADMIN });
    secretaryToken = generateToken({
      sub: secretary.id,
      role: Roles.SECRETARY,
    });
  });

  test("the patient who owns the booking sees their own contact data", async () => {
    const res = await request(app)
      .get(`/schedules/slots/${ownerSlot.id}`)
      .set("Cookie", cookie(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBe(owner.email);
    expect(res.body.patient.phone).toBe(owner.phone);
    expect(res.body.patient.address).toBe(owner.address);
    expect(res.body.patient.nationalId).toBe(owner.nationalId);
    expect(res.body.consultationReason).toBe("Control");
  });

  test("a patient who does not own the slot gets the contact data redacted", async () => {
    const res = await request(app)
      .get(`/schedules/slots/${otherSlot.id}`)
      .set("Cookie", cookie(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBe("REDACTED");
    expect(res.body.patient.phone).toBe("REDACTED");
    expect(res.body.patient.address).toBe("REDACTED");
    expect(res.body.patient.nationalId).toBe("REDACTED");
  });

  test("the payload does not ship the owner id to the client", async () => {
    const res = await request(app)
      .get(`/schedules/slots/${otherSlot.id}`)
      .set("Cookie", cookie(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.patientId).toBeUndefined();
  });

  test("ADMIN still sees the full record of any slot", async () => {
    const res = await request(app)
      .get(`/schedules/slots/${otherSlot.id}`)
      .set("Cookie", cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBe(other.email);
    expect(res.body.patient.nationalId).toBe(other.nationalId);
  });

  test("SECRETARY still sees the full record of any slot", async () => {
    const res = await request(app)
      .get(`/schedules/slots/${ownerSlot.id}`)
      .set("Cookie", cookie(secretaryToken));

    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBe(owner.email);
    expect(res.body.patient.phone).toBe(owner.phone);
  });

  test("a PROFESSIONAL keeps getting the contact data redacted", async () => {
    const professional = await prisma.user.create({
      data: {
        email: "otro.medico@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dra. Otra",
        lastNames: "Médica",
        nationalId: "30000010",
        phone: "1111111112",
        address: "Consultorio 2",
      },
    });
    const token = generateToken({
      sub: professional.id,
      role: Roles.PROFESSIONAL,
    });

    const res = await request(app)
      .get(`/schedules/slots/${ownerSlot.id}`)
      .set("Cookie", cookie(token));

    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBe("REDACTED");
    expect(res.body.patient.nationalId).toBe("REDACTED");
  });
});
