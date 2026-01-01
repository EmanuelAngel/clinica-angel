import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";

describe("User register integration", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  const validPayload = {
    email: "test@example.com",
    password: "StrongPass1",
    role: Roles.SECRETARY,
    firstNames: "Test",
    lastNames: "User",
    nationalId: "12345678",
    phone: "123456789",
    address: "Street 123",
  };

  test("registers a user when an admin is authenticated", async () => {
    const response = await request(app)
      .post("/users")
      .set("Cookie", `access_token=${adminToken}`)
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.text).toContain("Usuario registrado correctamente.");

    const stored = await prisma.user.findUnique({
      where: { email: validPayload.email.toLowerCase() },
    });

    expect(stored).not.toBeNull();
    expect(stored?.role).toBe(validPayload.role);
  });

  test("returns 422 when email is invalid", async () => {
    const payload = {
      ...validPayload,
      email: "invalid-email",
    };

    const response = await request(app)
      .post("/users")
      .set("Cookie", `access_token=${adminToken}`)
      .send(payload);

    expect(response.status).toBe(422);
  });

  test("returns 422 when password is too short", async () => {
    const payload = {
      ...validPayload,
      password: "Short1",
    };

    const response = await request(app)
      .post("/users")
      .set("Cookie", `access_token=${adminToken}`)
      .send(payload);

    expect(response.status).toBe(422);
  });

  test("returns 409 when user with email already exists", async () => {
    // Create a user first
    await prisma.user.create({
      data: {
        email: validPayload.email,
        passwordHash: "hashed",
        role: validPayload.role,
        firstNames: validPayload.firstNames,
        lastNames: validPayload.lastNames,
        nationalId: "99999999",
        phone: validPayload.phone,
        address: validPayload.address,
      },
    });

    const response = await request(app)
      .post("/users")
      .set("Cookie", `access_token=${adminToken}`)
      .send(validPayload);

    expect(response.status).toBe(409);
  });

  test("returns 409 when user with national ID and role already exists", async () => {
    // Create a user with the same national ID and role
    await prisma.user.create({
      data: {
        email: "different@example.com",
        passwordHash: "hashed",
        role: validPayload.role,
        firstNames: validPayload.firstNames,
        lastNames: validPayload.lastNames,
        nationalId: validPayload.nationalId,
        phone: validPayload.phone,
        address: validPayload.address,
      },
    });

    const response = await request(app)
      .post("/users")
      .set("Cookie", `access_token=${adminToken}`)
      .send(validPayload);

    expect(response.status).toBe(409);
  });
});
