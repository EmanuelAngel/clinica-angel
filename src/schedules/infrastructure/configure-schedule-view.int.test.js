import request from "supertest";

import app from "../../app.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Configure schedule view integration tests", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  /**
   * Payload that breaks out of a `<script>` block when interpolated unescaped.
   * @type {string}
   */
  const SCRIPT_BREAKOUT = "</script><script>alert(1)</script>";

  describe("GET /schedules/create", () => {
    test("renders the form with empty hydrated collections", async () => {
      const response = await request(app)
        .get("/schedules/create")
        .set("Cookie", `access_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain("const initialWeeklyDays = [];");
      expect(response.text).toContain("const initialBlocks = [];");
    });
  });

  describe("POST /schedules validation error re-render", () => {
    test("does not break the script block when a block motive contains a closing script tag", async () => {
      const response = await request(app)
        .post("/schedules")
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          config: { from: "2024-03-01", to: "2024-03-30", weeklyDays: [] },
          blocks: [
            { start: "2024-03-15", end: "2024-03-16", motive: SCRIPT_BREAKOUT },
          ],
        });

      expect(response.status).toBe(422);
      expect(response.text).not.toContain(SCRIPT_BREAKOUT);
      expect(response.text).toContain("\\u003c/script\\u003e");
    });

    test("keeps re-rendering the submitted weekly days as valid json", async () => {
      const weeklyDays = [
        { day: "MONDAY", ranges: [{ start: "09:00", end: "12:00" }] },
      ];

      const response = await request(app)
        .post("/schedules")
        .set("Cookie", `access_token=${adminToken}`)
        .send({
          config: { from: "2024-03-01", to: "2024-06-30", weeklyDays },
        });

      expect(response.status).toBe(422);

      const rendered = response.text.match(
        /const initialWeeklyDays = ([\s\S]*?);\n/
      );
      expect(rendered).not.toBeNull();
      expect(JSON.parse(rendered[1])).toEqual(weeklyDays);
    });
  });
});
