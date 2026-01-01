import request from "supertest";
import bcrypt from "bcrypt";

import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { Roles } from "../domain/roles.js";

describe("Auth login integration", () => {
  const testPassword = "TestPassword123";
  /** @type {any} */
  let testUser;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        passwordHash,
        role: Roles.SECRETARY,
        firstNames: "Test",
        lastNames: "User",
        nationalId: "12345678",
        phone: "123456789",
        address: "Test Address",
      },
    });
  });

  test("successfully logs in with valid credentials", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: testPassword,
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/users");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"][0]).toContain("access_token=");
  });

  test("returns 422 when email is invalid", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "invalid-email",
      password: testPassword,
    });

    expect(response.status).toBe(422);
  });

  test("returns 422 when password is missing", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
    });

    expect(response.status).toBe(422);
  });

  test("returns 401 when credentials are incorrect", async () => {
    const response = await request(app).post("/auth/login").send({
      email: testUser.email,
      password: "WrongPassword123",
    });

    expect(response.status).toBe(401);
  });
});
