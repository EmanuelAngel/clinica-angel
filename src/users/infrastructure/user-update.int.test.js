import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("User update integration", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });
  const secretaryToken = generateToken({ sub: 998, role: Roles.SECRETARY });
  const patientToken = generateToken({ sub: 997, role: Roles.PATIENT });

  const validUpdate = {
    firstNames: "Updated",
    lastNames: "Name",
    phone: "987654321",
    address: "New Address 456",
  };

  /**
   * Helper to create a test user in the database.
   * @param {string} email
   */
  async function createTestUser(email) {
    return prisma.user.create({
      data: {
        email,
        passwordHash: "hashed",
        role: Roles.SECRETARY,
        firstNames: "Original",
        lastNames: "User",
        nationalId: String(Math.floor(1000000 + Math.random() * 9000000)),
        phone: "123456789",
        address: "Street 123",
      },
    });
  }

  test("updates profile successfully as admin", async () => {
    const user = await createTestUser("update-admin@example.com");

    const response = await request(app)
      .post(`/users/${user.id}`)
      .set("Cookie", `access_token=${adminToken}`)
      .send(validUpdate);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`/users/${user.id}`);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.firstNames).toBe(validUpdate.firstNames);
    expect(updated.lastNames).toBe(validUpdate.lastNames);
    expect(updated.phone).toBe(validUpdate.phone);
    expect(updated.address).toBe(validUpdate.address);
  });

  test("updates profile successfully as secretary", async () => {
    const user = await createTestUser("update-secretary@example.com");

    const response = await request(app)
      .post(`/users/${user.id}`)
      .set("Cookie", `access_token=${secretaryToken}`)
      .send(validUpdate);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`/users/${user.id}`);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.firstNames).toBe(validUpdate.firstNames);
  });

  test("returns 422 when firstNames is empty", async () => {
    const user = await createTestUser("update-invalid@example.com");

    const response = await request(app)
      .post(`/users/${user.id}`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({ ...validUpdate, firstNames: "" });

    expect(response.status).toBe(422);
  });

  test("returns 404 for non-existent user", async () => {
    const response = await request(app)
      .post("/users/99999")
      .set("Cookie", `access_token=${adminToken}`)
      .send(validUpdate);

    expect(response.status).toBe(404);
  });

  test("returns 403 for unauthorized role (patient)", async () => {
    const user = await createTestUser("update-patient@example.com");

    const response = await request(app)
      .post(`/users/${user.id}`)
      .set("Cookie", `access_token=${patientToken}`)
      .send(validUpdate);

    expect(response.status).toBe(403);
  });

  test("renders edit view for admin", async () => {
    const user = await createTestUser("edit-view-admin@example.com");

    const response = await request(app)
      .get(`/users/${user.id}/edit`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain(user.firstNames);
  });

  test("renders edit view for secretary", async () => {
    const user = await createTestUser("edit-view-secretary@example.com");

    const response = await request(app)
      .get(`/users/${user.id}/edit`)
      .set("Cookie", `access_token=${secretaryToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain(user.firstNames);
  });
});
