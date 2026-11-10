import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

/**
 * A PATIENT books for themselves, so the comparison view deliberately hides the
 * patient selector for that role and slot.controller derives the patient from
 * the session instead of the body. Restricting the route to SECRETARY/ADMIN
 * would remove that self-service path, which is a defended behaviour.
 */
describe("Schedule comparison access (GET /schedules/compare)", () => {
  const token = (role, sub) => `access_token=${generateToken({ sub, role })}`;

  test("PATIENT gets 200: self-service booking lives on this screen", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.PATIENT, 903));

    expect(res.status).toBe(200);
  });

  test("PATIENT does not get the patient selector", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.PATIENT, 903));

    expect(res.text).not.toContain('name="patientId"');
  });

  test("ADMIN gets the patient selector, because staff book for others", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.ADMIN, 901));

    expect(res.status).toBe(200);
    expect(res.text).toContain('name="patientId"');
  });

  test("SECRETARY gets 200", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.SECRETARY, 902));

    expect(res.status).toBe(200);
  });

  test("PROFESSIONAL gets 200: the route is open to any signed-in user", async () => {
    const res = await request(app)
      .get("/schedules/compare")
      .set("Cookie", token(Roles.PROFESSIONAL, 904));

    expect(res.status).toBe(200);
  });
});
