import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("Classification integration tests", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  describe("GET /classifications", () => {
    test("lists all classifications", async () => {
      // Create a classification first
      await prisma.classification.create({
        data: { name: "primera vez" },
      });

      const response = await request(app)
        .get("/classifications")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("primera vez");
    });

    test("shows empty table when no classifications exist", async () => {
      const response = await request(app)
        .get("/classifications")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Clasificaciones");
    });
  });

  describe("GET /classifications/create", () => {
    test("renders create classification form", async () => {
      const response = await request(app)
        .get("/classifications/create")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Nueva Clasificación");
    });
  });

  describe("POST /classifications", () => {
    test("creates a classification successfully", async () => {
      const response = await request(app)
        .post("/classifications")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Control" });

      expect(response.status).toBe(302); // Redirect
      expect(response.header.location).toBe("/classifications");

      const stored = await prisma.classification.findFirst({
        where: { name: "control" },
      });
      expect(stored).not.toBeNull();
    });

    test("returns 422 when name is too short", async () => {
      const response = await request(app)
        .post("/classifications")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "A" });

      expect(response.status).toBe(422);
    });

    test("returns 422 when name is missing", async () => {
      const response = await request(app)
        .post("/classifications")
        .set("Cookie", `access_token=${adminToken}`)
        .send({});

      expect(response.status).toBe(422);
    });

    test("returns 409 when classification already exists", async () => {
      await prisma.classification.create({
        data: { name: "urgencia" },
      });

      const response = await request(app)
        .post("/classifications")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Urgencia" });

      expect(response.status).toBe(409);
      expect(response.text).toContain("ya existe");
    });

    test("returns 409 for case-insensitive duplicate", async () => {
      await prisma.classification.create({
        data: { name: "emergencia" },
      });

      const response = await request(app)
        .post("/classifications")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "EMERGENCIA" });

      expect(response.status).toBe(409);
    });
  });

  describe("POST /classifications/:id", () => {
    test("updates a classification successfully", async () => {
      const classification = await prisma.classification.create({
        data: { name: "chequeo" },
      });

      const response = await request(app)
        .post(`/classifications/${classification.id}`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Chequeo anual" });

      expect(response.status).toBe(302); // Redirect
      expect(response.header.location).toBe("/classifications");

      const updated = await prisma.classification.findUnique({
        where: { id: classification.id },
      });
      expect(updated?.name).toBe("chequeo anual");
    });

    test("redirects when updating non-existent classification", async () => {
      const response = await request(app)
        .post("/classifications/99999")
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Test" });

      expect(response.status).toBe(302); // Redirect
      expect(response.header.location).toBe("/classifications");
    });

    test("redirects when updating to duplicate name", async () => {
      const classification1 = await prisma.classification.create({
        data: { name: "consulta inicial" },
      });
      await prisma.classification.create({
        data: { name: "consulta final" },
      });

      const response = await request(app)
        .post(`/classifications/${classification1.id}`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({ name: "Consulta final" });

      expect(response.status).toBe(302); // Redirect
      expect(response.header.location).toBe("/classifications");
    });
  });

  describe("POST /classifications/:id/delete", () => {
    test("deletes a classification successfully", async () => {
      const classification = await prisma.classification.create({
        data: { name: "temporal" },
      });

      const response = await request(app)
        .post(`/classifications/${classification.id}/delete`)
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(302); // Redirect
      expect(response.header.location).toBe("/classifications");

      const deleted = await prisma.classification.findUnique({
        where: { id: classification.id },
      });
      expect(deleted).toBeNull();
    });

    test("returns 404 when deleting non-existent classification", async () => {
      const response = await request(app)
        .post("/classifications/99999/delete")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
