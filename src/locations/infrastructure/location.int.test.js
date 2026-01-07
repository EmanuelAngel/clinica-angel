import request from "supertest";
import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("Location integration tests", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  describe("GET /locations", () => {
    test("lists all locations", async () => {
      await prisma.location.create({
        data: {
          name: "Sede Centro",
          address: "Av. Corrientes 1234",
          phone: "1122334455",
        },
      });

      const response = await request(app)
        .get("/locations")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Sede Centro");
      expect(response.text).toContain("Av. Corrientes 1234");
    });

    test("shows empty state when no locations exist", async () => {
      const response = await request(app)
        .get("/locations")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Sedes");
    });
  });

  describe("GET /locations/create", () => {
    test("renders create location form", async () => {
      const response = await request(app)
        .get("/locations/create")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("Nueva Sede");
    });
  });

  describe("POST /locations", () => {
    test("creates a location successfully", async () => {
      const response = await request(app)
        .post("/locations")
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          name: "Sede Norte",
          address: "Calle Falsa 123",
          phone: "1155556666",
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/locations");

      const location = await prisma.location.findFirst({
        where: { name: "Sede Norte" },
      });

      expect(location).toBeDefined();
      expect(location?.address).toBe("Calle Falsa 123");
    });

    test("returns 422 for invalid data", async () => {
      const response = await request(app)
        .post("/locations")
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          name: "",
          address: "Short",
        });

      expect(response.status).toBe(422);
    });
  });

  describe("POST /locations/:id", () => {
    test("updates a location", async () => {
      const created = await prisma.location.create({
        data: {
          name: "Sede Sur",
          address: "Av. Roca 100",
        },
      });

      const response = await request(app)
        .post(`/locations/${created.id}`)
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          name: "Sede Sur Renovada",
          address: "Av. Roca 200",
          phone: "1188889999",
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/locations");

      const updated = await prisma.location.findUnique({
        where: { id: created.id },
      });

      expect(updated.name).toBe("Sede Sur Renovada");
      expect(updated.address).toBe("Av. Roca 200");
    });
  });
});
