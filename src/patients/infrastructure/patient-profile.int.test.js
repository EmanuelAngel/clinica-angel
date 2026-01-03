import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Patient profile authorization integration", () => {
  /** @type {any} */
  let patient1;
  /** @type {any} */
  let patient2;
  /** @type {any} */
  let admin;
  /** @type {any} */
  let secretary;
  /** @type {any} */
  let professional;

  beforeEach(async () => {
    // Create test patients
    patient1 = await prisma.user.create({
      data: {
        email: "patient1@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Patient",
        lastNames: "One",
        nationalId: "11111111",
        phone: "1111111111",
        address: "Address 1",
        nationalIdImageUrl: "/uploads/patient1-id.png",
      },
    });

    patient2 = await prisma.user.create({
      data: {
        email: "patient2@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Patient",
        lastNames: "Two",
        nationalId: "22222222",
        phone: "2222222222",
        address: "Address 2",
        nationalIdImageUrl: "/uploads/patient2-id.png",
      },
    });

    // Create admin user
    admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: "hashed",
        role: Roles.ADMIN,
        firstNames: "Admin",
        lastNames: "User",
        nationalId: "99999999",
        phone: "9999999999",
        address: "Admin Address",
      },
    });

    // Create secretary user
    secretary = await prisma.user.create({
      data: {
        email: "secretary@example.com",
        passwordHash: "hashed",
        role: Roles.SECRETARY,
        firstNames: "Secretary",
        lastNames: "User",
        nationalId: "88888888",
        phone: "8888888888",
        address: "Secretary Address",
      },
    });

    // Create professional user
    professional = await prisma.user.create({
      data: {
        email: "professional@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Professional",
        lastNames: "User",
        nationalId: "77777777",
        phone: "7777777777",
        address: "Professional Address",
      },
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "patient1@example.com",
            "patient2@example.com",
            "admin@example.com",
            "secretary@example.com",
            "professional@example.com",
          ],
        },
      },
    });
  });

  test("returns 401 when no token is provided", async () => {
    const response = await request(app).get(`/patients/${patient1.id}`);

    expect(response.status).toBe(401);
  });

  test("allows ADMIN to access any patient profile", async () => {
    const adminToken = generateToken({ sub: admin.id, role: Roles.ADMIN });

    const response = await request(app)
      .get(`/patients/${patient1.id}`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Patient One");
    expect(response.text).toContain(patient1.email);
  });

  test("allows ADMIN to access a different patient profile", async () => {
    const adminToken = generateToken({ sub: admin.id, role: Roles.ADMIN });

    const response = await request(app)
      .get(`/patients/${patient2.id}`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Patient Two");
    expect(response.text).toContain(patient2.email);
  });

  test("allows SECRETARY to access any patient profile", async () => {
    const secretaryToken = generateToken({
      sub: secretary.id,
      role: Roles.SECRETARY,
    });

    const response = await request(app)
      .get(`/patients/${patient1.id}`)
      .set("Cookie", `access_token=${secretaryToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Patient One");
    expect(response.text).toContain(patient1.email);
  });

  test("allows SECRETARY to access a different patient profile", async () => {
    const secretaryToken = generateToken({
      sub: secretary.id,
      role: Roles.SECRETARY,
    });

    const response = await request(app)
      .get(`/patients/${patient2.id}`)
      .set("Cookie", `access_token=${secretaryToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Patient Two");
    expect(response.text).toContain(patient2.email);
  });

  test("allows PATIENT to access their own profile", async () => {
    const patientToken = generateToken({
      sub: patient1.id,
      role: Roles.PATIENT,
    });

    const response = await request(app)
      .get(`/patients/${patient1.id}`)
      .set("Cookie", `access_token=${patientToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Patient One");
    expect(response.text).toContain(patient1.email);
  });

  test("returns 403 when PATIENT tries to access another patient profile", async () => {
    const patientToken = generateToken({
      sub: patient1.id,
      role: Roles.PATIENT,
    });

    const response = await request(app)
      .get(`/patients/${patient2.id}`)
      .set("Cookie", `access_token=${patientToken}`);

    expect(response.status).toBe(403);
  });

  test("returns 403 when PROFESSIONAL tries to access a patient profile", async () => {
    const professionalToken = generateToken({
      sub: professional.id,
      role: Roles.PROFESSIONAL,
    });

    const response = await request(app)
      .get(`/patients/${patient1.id}`)
      .set("Cookie", `access_token=${professionalToken}`);

    expect(response.status).toBe(403);
  });

  test("returns 404 when patient does not exist", async () => {
    const adminToken = generateToken({ sub: admin.id, role: Roles.ADMIN });

    const response = await request(app)
      .get("/patients/99999")
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).toBe(404);
  });

  test("returns 403 when PATIENT tries to access non-existent profile (not their own)", async () => {
    const patientToken = generateToken({
      sub: patient1.id,
      role: Roles.PATIENT,
    });

    const response = await request(app)
      .get("/patients/99999")
      .set("Cookie", `access_token=${patientToken}`);

    // Authorization check happens before database lookup, so unauthorized access
    // returns 403 even if the resource doesn't exist (security best practice)
    expect(response.status).toBe(403);
  });
});
