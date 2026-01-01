import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("User show integration", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  test("returns user profile when user exists", async () => {
    const user = await prisma.user.create({
      data: {
        email: "show-test@example.com",
        passwordHash: "hashed",
        role: Roles.SECRETARY,
        firstNames: "Test",
        lastNames: "User",
        nationalId: "87654321",
        phone: "123456789",
        address: "Street 123",
      },
    });

    const response = await request(app)
      .get(`/users/${user.id}`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).toBe(200);
  });

  test("returns 404 when user does not exist", async () => {
    const nonExistentId = 99999;

    const response = await request(app)
      .get(`/users/${nonExistentId}`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).toBe(404);
  });
});
