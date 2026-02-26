import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Professional profile and specialty management", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  /** @type {any} */
  let profUser;
  /** @type {any} */
  let specialty;
  /** @type {any} */
  let specialty2;
  /** @type {any} */
  let classification;
  /** @type {any} */
  let location;
  /** @type {any} */
  let profSpecialty;
  /** @type {any} */
  let schedule;
  /** @type {any} */
  let patient;
  /** @type {any} */
  let insurance;

  beforeEach(async () => {
    // Create specialty
    specialty = await prisma.specialty.create({
      data: { name: "Cardiology Prof Test" },
    });

    specialty2 = await prisma.specialty.create({
      data: { name: "Neurology Prof Test" },
    });

    // Create professional user
    profUser = await prisma.user.create({
      data: {
        email: "drprofile@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Carlos",
        lastNames: "Gonzalez",
        nationalId: "55555555",
        phone: "123456789",
        address: "Medical Street 123",
      },
    });

    // Create professional specialty
    profSpecialty = await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP-PROF-TEST",
        userId: profUser.id,
        specialtyId: specialty.id,
      },
    });

    // Create location and classification for schedule
    location = await prisma.location.create({
      data: { name: "Test Clinic Prof", address: "Clinic Address Prof" },
    });

    classification = await prisma.classification.create({
      data: { name: "Consultation Prof Test" },
    });

    // Create schedule
    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: profSpecialty.licenseNumber,
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 30,
      },
    });

    // Create insurance
    insurance = await prisma.healthInsurance.create({
      data: { name: "Prof Test Insurance" },
    });

    // Create patient with insurance
    patient = await prisma.user.create({
      data: {
        email: "patient_prof@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Maria",
        lastNames: "Lopez",
        nationalId: "66666666",
        phone: "987654321",
        address: "Patient Street 456",
        patientInsurances: {
          create: {
            insuranceId: insurance.id,
            memberNumber: "AF-999",
          },
        },
      },
    });

    // Create slots (Past, Today, Future)
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 3);

    const todayDate = new Date(now);
    todayDate.setHours(14, 0, 0, 0);

    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 5);

    await prisma.slot.createMany({
      data: [
        {
          scheduleId: schedule.id,
          patientId: patient.id,
          startsAt: pastDate,
          status: "FULFILLED",
          consultationReason: "Control de rutina",
        },
        {
          scheduleId: schedule.id,
          patientId: patient.id,
          startsAt: todayDate,
          status: "BOOKED",
          consultationReason: "Dolor en pecho",
        },
        {
          scheduleId: schedule.id,
          patientId: patient.id,
          startsAt: futureDate,
          status: "BOOKED",
          consultationReason: "Seguimiento",
        },
      ],
    });
  });

  describe("GET /professionals/:id/profile", () => {
    test("renders profile with specialties and tabs for Admin", async () => {
      const res = await request(app)
        .get(`/professionals/${profUser.id}/profile`)
        .set("Cookie", `access_token=${adminToken}`);

      expect(res.status).toBe(200);
      // Professional data
      expect(res.text).toContain("Carlos Gonzalez");
      expect(res.text).toContain("55555555");
      // Specialty displayed
      expect(res.text).toContain("Cardiology Prof Test");
      expect(res.text).toContain("MP-PROF-TEST");
      // Tabs present
      expect(res.text).toContain('aria-label="Hoy"');
      expect(res.text).toContain('aria-label="Futuros"');
      expect(res.text).toContain('aria-label="Pasados"');
      // Admin sees the add specialty form
      expect(res.text).toContain("Agregar Especialidad");
      expect(res.text).toContain('name="specialtyId"');
      expect(res.text).toContain('name="licenseNumber"');
    });

    test("renders profile for the professional themselves (owner access)", async () => {
      const profToken = generateToken({
        sub: profUser.id,
        role: Roles.PROFESSIONAL,
      });

      const res = await request(app)
        .get(`/professionals/${profUser.id}/profile`)
        .set("Cookie", `access_token=${profToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain("Carlos Gonzalez");
      // Professional should NOT see the add specialty form
      expect(res.text).not.toContain("Agregar Especialidad");
    });

    test("returns 403 for a different professional", async () => {
      const otherProfToken = generateToken({
        sub: 88888,
        role: Roles.PROFESSIONAL,
      });

      const res = await request(app)
        .get(`/professionals/${profUser.id}/profile`)
        .set("Cookie", `access_token=${otherProfToken}`);

      expect(res.status).toBe(403);
    });

    test("returns 404 for non-existent professional", async () => {
      const res = await request(app)
        .get("/professionals/99999/profile")
        .set("Cookie", `access_token=${adminToken}`);

      expect(res.status).toBe(404);
    });

    test("renders slots with patient data, insurance and schedule info", async () => {
      const res = await request(app)
        .get(`/professionals/${profUser.id}/profile`)
        .set("Cookie", `access_token=${adminToken}`);

      expect(res.status).toBe(200);
      // Patient data in slot card
      expect(res.text).toContain("Maria Lopez");
      expect(res.text).toContain("66666666");
      // Insurance
      expect(res.text).toContain("Prof Test Insurance");
      expect(res.text).toContain("AF-999");
      // Classification/Specialty in slot
      expect(res.text).toContain("Consultation Prof Test");
      // Consultation reasons
      expect(res.text).toContain("Dolor en pecho");
    });
  });

  describe("POST /professionals/:id/specialties", () => {
    test("Admin can add a specialty successfully", async () => {
      const res = await request(app)
        .post(`/professionals/${profUser.id}/specialties`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          specialtyId: specialty2.id,
          licenseNumber: "MP-NEW-LIC",
        });

      // Should redirect to profile
      expect(res.status).toBe(302);
      expect(res.header.location).toBe(`/professionals/${profUser.id}/profile`);

      // Verify in DB
      const stored = await prisma.professionalSpecialty.findUnique({
        where: { licenseNumber: "MP-NEW-LIC" },
      });
      expect(stored).not.toBeNull();
      expect(stored.userId).toBe(profUser.id);
      expect(stored.specialtyId).toBe(specialty2.id);
    });

    test("returns 422 on validation error (empty license)", async () => {
      const res = await request(app)
        .post(`/professionals/${profUser.id}/specialties`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          specialtyId: specialty2.id,
          licenseNumber: "",
        });

      expect(res.status).toBe(422);
    });

    test("returns 409 for duplicate license number", async () => {
      const res = await request(app)
        .post(`/professionals/${profUser.id}/specialties`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          specialtyId: specialty2.id,
          licenseNumber: "MP-PROF-TEST", // Already exists
        });

      expect(res.status).toBe(409);
      expect(res.text).toContain("ya está registrado");
    });

    test("returns 403 for non-Admin users", async () => {
      const profToken = generateToken({
        sub: profUser.id,
        role: Roles.PROFESSIONAL,
      });

      const res = await request(app)
        .post(`/professionals/${profUser.id}/specialties`)
        .set("Cookie", `access_token=${profToken}`)
        .send({
          specialtyId: specialty2.id,
          licenseNumber: "MP-ANOTHER",
        });

      expect(res.status).toBe(403);
    });
  });
});
