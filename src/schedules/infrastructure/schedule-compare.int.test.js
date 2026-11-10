import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

/**
 * The comparison view loads its filter dropdowns from /api/v1/professionals and
 * /api/v1/specialties, which are SECRETARY/ADMIN only. For a PATIENT the page
 * rendered with empty filters, so it was reachable but unusable. The route now
 * matches the roles the screen can actually serve.
 */
describe("Schedule comparison access (GET /schedules/compare)", () => {
  const token = (role, sub) => `access_token=${generateToken({ sub, role })}`;

  test("ADMIN gets 200", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.ADMIN, 901));

    expect(res.status).toBe(200);
  });

  test("SECRETARY gets 200", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.SECRETARY, 902));

    expect(res.status).toBe(200);
  });

  test("PATIENT is rejected with 403", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.PATIENT, 903));

    expect(res.status).toBe(403);
  });

  test("PROFESSIONAL is rejected with 403", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.PROFESSIONAL, 904));

    expect(res.status).toBe(403);
  });
});
