import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("Professional integration tests", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  const validPayload = {
    email: "doctor@example.com",
    password: "StrongPass1",
    firstNames: "Juan",
    lastNames: "Pérez",
    nationalId: "30123456",
    phone: "123456789",
    address: "Calle Médica 123",
  };

  describe("GET /professionals", () => {
    test("lists all professionals", async () => {
      // Create a professional first
      await prisma.user.create({
        data: {
          email: "listtest@example.com",
          passwordHash: "hashed",
          role: Roles.PROFESSIONAL,
          firstNames: "Test",
          lastNames: "Doctor",
          nationalId: "11111111",
          phone: "123456789",
          address: "Test Address",
        },
      });

      const response = await request(app)
        .get("/professionals")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Test Doctor");
    });

    test("shows empty table when no professionals exist", async () => {
      const response = await request(app)
        .get("/professionals")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Profesionales");
    });
  });

  describe("GET /professionals/create", () => {
    test("renders create professional form", async () => {
      const response = await request(app)
        .get("/professionals/create")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Registrar Profesional");
    });
  });

  describe("POST /professionals", () => {
    test("creates a professional without credentials", async () => {
      const response = await request(app)
        .post("/professionals")
        .set("Cookie", `access_token=${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.text).toContain("Profesional registrado correctamente");

      const stored = await prisma.user.findFirst({
        where: { email: validPayload.email, role: Roles.PROFESSIONAL },
      });
      expect(stored).not.toBeNull();
    });

    test("creates a professional with credentials", async () => {
      const specialty = await prisma.specialty.create({
        data: { name: "Cardiología Create Test" },
      });

      const payload = {
        ...validPayload,
        email: "cardiologo@example.com",
        nationalId: "30123457",
        credentials: [{ specialtyId: specialty.id, licenseNumber: "MP-12345" }],
      };

      const response = await request(app)
        .post("/professionals")
        .set("Cookie", `access_token=${adminToken}`)
        .send(payload);

      expect(response.status).toBe(201);

      const stored = await prisma.user.findFirst({
        where: { email: payload.email },
        include: { professionalCredentials: true },
      });
      expect(stored).not.toBeNull();
      expect(stored?.professionalCredentials).toHaveLength(1);
      expect(stored?.professionalCredentials[0].licenseNumber).toBe("MP-12345");
    });

    test("returns 422 when email is invalid", async () => {
      const response = await request(app)
        .post("/professionals")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ ...validPayload, email: "invalid" });

      expect(response.status).toBe(422);
    });

    test("returns 409 when email already exists", async () => {
      await prisma.user.create({
        data: {
          email: validPayload.email,
          passwordHash: "hashed",
          role: Roles.ADMIN,
          firstNames: "Existing",
          lastNames: "User",
          nationalId: "99999998",
          phone: "123456789",
          address: "Existing Address",
        },
      });

      const response = await request(app)
        .post("/professionals")
        .set("Cookie", `access_token=${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(409);
      expect(response.text).toContain("ya está en uso");
    });

    test("returns 409 when license number already exists", async () => {
      const specialty = await prisma.specialty.create({
        data: { name: "Neurología License Test" },
      });

      // Create an existing professional with a license
      const existingPro = await prisma.user.create({
        data: {
          email: "existing@example.com",
          passwordHash: "hashed",
          role: Roles.PROFESSIONAL,
          firstNames: "Existing",
          lastNames: "Pro",
          nationalId: "22222222",
          phone: "123456789",
          address: "Existing Address",
        },
      });

      await prisma.professionalSpecialty.create({
        data: {
          licenseNumber: "MP-DUPLICATE",
          userId: existingPro.id,
          specialtyId: specialty.id,
        },
      });

      const payload = {
        ...validPayload,
        email: "newpro@example.com",
        nationalId: "33333333",
        credentials: [
          { specialtyId: specialty.id, licenseNumber: "MP-DUPLICATE" },
        ],
      };

      const response = await request(app)
        .post("/professionals")
        .set("Cookie", `access_token=${adminToken}`)
        .send(payload);

      expect(response.status).toBe(409);
      expect(response.text).toContain("ya está registrado");
    });
  });

  describe("GET /professionals/:id/profile", () => {
    test("shows professional profile", async () => {
      const pro = await prisma.user.create({
        data: {
          email: "profile@example.com",
          passwordHash: "hashed",
          role: Roles.PROFESSIONAL,
          firstNames: "Profile",
          lastNames: "Test",
          nationalId: "44444444",
          phone: "123456789",
          address: "Profile Address",
        },
      });

      const response = await request(app)
        .get(`/professionals/${pro.id}/profile`)
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Profile Test");
    });

    test("returns 404 for non-existent professional", async () => {
      const response = await request(app)
        .get("/professionals/99999/profile")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
