import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("Specialty integration tests", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  describe("GET /specialties", () => {
    test("lists all specialties", async () => {
      // Create a specialty first
      await prisma.specialty.create({
        data: { name: "Cardiología Test" },
      });

      const response = await request(app)
        .get("/specialties")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Cardiología Test");
    });

    test("shows empty table when no specialties exist", async () => {
      const response = await request(app)
        .get("/specialties")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Especialidades");
    });
  });

  describe("GET /specialties/create", () => {
    test("renders create specialty form", async () => {
      const response = await request(app)
        .get("/specialties/create")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Nueva Especialidad");
    });
  });

  describe("POST /specialties", () => {
    test("creates a specialty successfully", async () => {
      const response = await request(app)
        .post("/specialties")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Neurología" });

      expect(response.status).toBe(201);
      expect(response.text).toContain("Especialidad creada correctamente");

      const stored = await prisma.specialty.findFirst({
        where: { name: "Neurología" },
      });
      expect(stored).not.toBeNull();
    });

    test("returns 422 when name is too short", async () => {
      const response = await request(app)
        .post("/specialties")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "A" });

      expect(response.status).toBe(422);
    });

    test("returns 422 when name is missing", async () => {
      const response = await request(app)
        .post("/specialties")
        .set("Cookie", `access_token=${adminToken}`)
        .send({});

      expect(response.status).toBe(422);
    });

    test("returns 409 when specialty already exists", async () => {
      await prisma.specialty.create({
        data: { name: "Pediatría" },
      });

      const response = await request(app)
        .post("/specialties")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Pediatría" });

      expect(response.status).toBe(409);
      expect(response.text).toContain("ya existe");
    });

    test("returns 409 for case-insensitive duplicate", async () => {
      await prisma.specialty.create({
        data: { name: "Dermatología" },
      });

      const response = await request(app)
        .post("/specialties")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "dermatología" });

      expect(response.status).toBe(409);
    });
  });
});
