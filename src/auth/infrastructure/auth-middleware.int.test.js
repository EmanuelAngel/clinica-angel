import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../app.js";
import { generateToken } from "./jwt.js";
import { Roles } from "../domain/roles.js";
import { env } from "../../_shared/infrastructure/env-variables.js";

describe("Auth middleware integration", () => {
  test("returns 401 when no token is provided", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(401);
  });

  test("returns 401 when token is expired", async () => {
    const expiredToken = jwt.sign(
      { sub: 1, role: Roles.ADMIN },
      env.JWT_SECRET,
      { expiresIn: "-1h" }
    );

    const response = await request(app)
      .get("/users")
      .set("Cookie", `access_token=${expiredToken}`);

    expect(response.status).toBe(401);
  });

  test("returns 403 when user role is not authorized", async () => {
    const patientToken = generateToken({ sub: 1, role: Roles.PATIENT });

    const response = await request(app)
      .get("/users")
      .set("Cookie", `access_token=${patientToken}`);

    expect(response.status).toBe(403);
  });

  test("allows access when user has authorized role", async () => {
    const adminToken = generateToken({ sub: 1, role: Roles.ADMIN });

    const response = await request(app)
      .get("/users")
      .set("Cookie", `access_token=${adminToken}`);

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBe(200);
  });
});
