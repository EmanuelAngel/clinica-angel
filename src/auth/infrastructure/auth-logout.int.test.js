import request from "supertest";

import app from "../../app.js";
import { generateToken } from "./jwt.js";
import { Roles } from "../domain/roles.js";

describe("Auth logout integration", () => {
  test("successfully logs out and redirects when accepting HTML", async () => {
    const token = generateToken({ sub: 1, role: Roles.ADMIN });

    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", `access_token=${token}`)
      .set("Accept", "text/html");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/auth/login");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"][0]).toContain("access_token=;");
  });
});
