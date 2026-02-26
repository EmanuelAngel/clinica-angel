import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Patient profile extended features integration", () => {
  /** @type {any} */
  let patient;
  /** @type {any} */
  let insurance;
  /** @type {any} */
  let location;
  /** @type {any} */
  let classification;
  /** @type {any} */
  let professional;
  /** @type {any} */
  let professionalSpecialty;
  /** @type {any} */
  let schedule;

  beforeEach(async () => {
    // 1. Create Health Insurance
    insurance = await prisma.healthInsurance.create({
      data: { name: "Test Insurance" },
    });

    // 2. Create Patient with Insurance
    patient = await prisma.user.create({
      data: {
        email: "patient_ext@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Patient",
        lastNames: "Extended",
        nationalId: "99887766",
        phone: "12345678",
        address: "Test Address",
        nationalIdImageUrl: "/uploads/test-id.png",
        patientInsurances: {
          create: {
            insuranceId: insurance.id,
            memberNumber: "MEM-123",
          },
        },
      },
    });

    // 3. Setup for Slots (Location, Professional, Schedule)
    location = await prisma.location.create({
      data: { name: "Test Clinic", address: "Clinic Address" },
    });

    classification = await prisma.classification.create({
      data: { name: "Test Specialty" },
    });

    const profUser = await prisma.user.create({
      data: {
        email: "prof_ext@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Dr",
        lastNames: "House",
        nationalId: "77777777",
        phone: "77777777",
        address: "Hospital",
      },
    });

    professionalSpecialty = await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "LICENSE-EXT",
        userId: profUser.id,
        specialtyId: (
          await prisma.specialty.create({ data: { name: "General" } })
        ).id,
      },
    });

    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: professionalSpecialty.licenseNumber,
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 30,
      },
    });

    // 4. Create Slots (Past, Today, Future)
    const now = new Date();

    // Past
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 2);

    // Today
    const todayDate = new Date(now);
    todayDate.setHours(14, 0, 0, 0);

    // Future
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 2);

    await prisma.slot.createMany({
      data: [
        {
          scheduleId: schedule.id,
          patientId: patient.id,
          startsAt: pastDate,
          status: "BOOKED",
        },
        {
          scheduleId: schedule.id,
          patientId: patient.id,
          startsAt: todayDate,
          status: "BOOKED",
        },
        {
          scheduleId: schedule.id,
          patientId: patient.id,
          startsAt: futureDate,
          status: "BOOKED",
        },
      ],
    });
  });

  afterEach(async () => {
    // Cleanup in reverse order of dependencies
    await prisma.slot.deleteMany({ where: { patientId: patient.id } });
    await prisma.patientHealthInsurance.deleteMany({
      where: { userId: patient.id },
    });
    await prisma.schedule.deleteMany({ where: { id: schedule.id } });
    await prisma.professionalSpecialty.deleteMany({
      where: { licenseNumber: professionalSpecialty.licenseNumber },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ["patient_ext@example.com", "prof_ext@example.com"] },
      },
    });
    await prisma.location.deleteMany({ where: { id: location.id } });
    await prisma.classification.deleteMany({
      where: { name: "Test Specialty" },
    });
    await prisma.specialty.deleteMany({ where: { name: "General" } });
    await prisma.healthInsurance.deleteMany({ where: { id: insurance.id } });
  });

  test("GET /patients/:id renders extended profile with insurance and slots", async () => {
    const token = generateToken({ sub: patient.id, role: Roles.PATIENT });

    const res = await request(app)
      .get(`/patients/${patient.id}`)
      .set("Cookie", `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("TEST INSURANCE"); // View uses uppercase for name
    expect(res.text).toContain("MEM-123");
    expect(res.text).toContain("/uploads/test-id.png");
    expect(res.text).toContain("Test Clinic");
    expect(res.text).toContain("Test Specialty");
    expect(res.text).toContain("Dr House");

    // Check tabs are present
    expect(res.text).toContain('aria-label="Hoy"');
    expect(res.text).toContain('aria-label="Futuros"');
    expect(res.text).toContain('aria-label="Pasados"');
  });

  test("GET /patients/:id/edit renders edit form", async () => {
    const token = generateToken({ sub: patient.id, role: Roles.PATIENT });

    const res = await request(app)
      .get(`/patients/${patient.id}/edit`)
      .set("Cookie", `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Editar perfil");
    expect(res.text).toContain('name="firstNames"');
    expect(res.text).toContain(patient.firstNames);
  });

  test("POST /patients/:id updates profile successfully", async () => {
    const token = generateToken({ sub: patient.id, role: Roles.PATIENT });

    const res = await request(app)
      .post(`/patients/${patient.id}`)
      .set("Cookie", `access_token=${token}`)
      .send({
        firstNames: "UpdatedName",
        lastNames: "UpdatedLastName",
        phone: "99999999",
        address: "New Street 123",
      });

    expect(res.status).toBe(302); // Redirect to profile
    expect(res.header.location).toBe(`/patients/${patient.id}`);

    const updated = await prisma.user.findUnique({ where: { id: patient.id } });
    expect(updated.firstNames).toBe("UpdatedName");
    expect(updated.phone).toBe("99999999");
  });

  test("POST /patients/:id returns 422 on validation error", async () => {
    const token = generateToken({ sub: patient.id, role: Roles.PATIENT });

    const res = await request(app)
      .post(`/patients/${patient.id}`)
      .set("Cookie", `access_token=${token}`)
      .send({
        firstNames: "", // Invalid
        lastNames: "Last",
        phone: "123",
        address: "Add",
      });

    expect(res.status).toBe(422);
    expect(res.text).toContain("Revise los datos ingresados");
  });
});
