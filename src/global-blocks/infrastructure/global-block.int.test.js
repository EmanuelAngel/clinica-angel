import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

/** Helper to build a future date string YYYY-MM-DD. */
function futureDateStr(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Helper to build a past date string YYYY-MM-DD. */
function pastDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

afterEach(async () => {
  await prisma.scheduleBlock.deleteMany({
    where: { scheduleId: null },
  });
});

describe("GET /global-blocks", () => {
  test("returns 200 and renders the list view", async () => {
    const res = await request(app)
      .get("/global-blocks")
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Bloqueos Globales");
  });
});

describe("GET /global-blocks/create", () => {
  test("returns 200 and renders the create form", async () => {
    const res = await request(app)
      .get("/global-blocks/create")
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Nuevo Bloqueo Global");
  });
});

describe("POST /global-blocks", () => {
  test("creates a global block with future dates", async () => {
    const startDate = futureDateStr(10);
    const endDate = futureDateStr(12);

    const res = await request(app)
      .post("/global-blocks")
      .set("Cookie", `access_token=${adminToken}`)
      .send({ startDate, endDate, reason: "Feriado de prueba" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/global-blocks");

    const stored = await prisma.scheduleBlock.findFirst({
      where: { reason: "Feriado de prueba", scheduleId: null },
    });
    expect(stored).not.toBeNull();
  });

  test("returns 422 when endDate is before startDate", async () => {
    const res = await request(app)
      .post("/global-blocks")
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: futureDateStr(12),
        endDate: futureDateStr(10),
        reason: "Inválido",
      });

    expect(res.status).toBe(422);
  });

  test("returns 422 when reason is too short", async () => {
    const res = await request(app)
      .post("/global-blocks")
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: futureDateStr(10),
        endDate: futureDateStr(12),
        reason: "ab",
      });

    expect(res.status).toBe(422);
  });

  test("rejects creation with past dates", async () => {
    const res = await request(app)
      .post("/global-blocks")
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: pastDateStr(10),
        endDate: pastDateStr(5),
        reason: "Bloqueo pasado",
      });

    expect(res.status).toBe(422);
  });
});

describe("POST /global-blocks/:id (update)", () => {
  test("updates a global block with future dates", async () => {
    const block = await prisma.scheduleBlock.create({
      data: {
        startDate: new Date(futureDateStr(10)),
        endDate: new Date(futureDateStr(12)),
        reason: "Original",
        scheduleId: null,
      },
    });

    const res = await request(app)
      .post(`/global-blocks/${block.id}`)
      .set("Cookie", `access_token=${adminToken}`)
      .send({
        startDate: futureDateStr(15),
        endDate: futureDateStr(20),
        reason: "Actualizado",
      });

    expect(res.status).toBe(302);

    const updated = await prisma.scheduleBlock.findUnique({
      where: { id: block.id },
    });
    expect(updated.reason).toBe("Actualizado");
  });
});

describe("POST /global-blocks/:id/delete", () => {
  test("deletes a global block with future dates", async () => {
    const block = await prisma.scheduleBlock.create({
      data: {
        startDate: new Date(futureDateStr(10)),
        endDate: new Date(futureDateStr(12)),
        reason: "A eliminar",
        scheduleId: null,
      },
    });

    const res = await request(app)
      .post(`/global-blocks/${block.id}/delete`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(302);

    const deleted = await prisma.scheduleBlock.findUnique({
      where: { id: block.id },
    });
    expect(deleted).toBeNull();
  });

  test("rejects deleting a block that is entirely in the past", async () => {
    const block = await prisma.scheduleBlock.create({
      data: {
        startDate: new Date(pastDateStr(10)),
        endDate: new Date(pastDateStr(5)),
        reason: "Pasado",
        scheduleId: null,
      },
    });

    const res = await request(app)
      .post(`/global-blocks/${block.id}/delete`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(422);
  });
});
