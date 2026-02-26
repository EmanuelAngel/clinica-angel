import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { generateToken } from "../../auth/infrastructure/jwt.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Schedule drilldown view (GET /schedules/:id/agenda)", () => {
  const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

  /** @type {any} */
  let schedule;

  beforeEach(async () => {
    const specialty = await prisma.specialty.create({
      data: { name: "Drilldown Test Specialty" },
    });

    const profUser = await prisma.user.create({
      data: {
        email: "drilldown-prof@example.com",
        passwordHash: "hashed",
        role: Roles.PROFESSIONAL,
        firstNames: "Ana",
        lastNames: "Martinez",
        nationalId: "77777777",
        phone: "1122334455",
        address: "Drilldown Street 1",
      },
    });

    const profSpecialty = await prisma.professionalSpecialty.create({
      data: {
        licenseNumber: "MP-DRILL-TEST",
        userId: profUser.id,
        specialtyId: specialty.id,
      },
    });

    const location = await prisma.location.create({
      data: { name: "Drilldown Clinic", address: "Drilldown Address" },
    });

    const classification = await prisma.classification.create({
      data: { name: "Drilldown Consultation" },
    });

    schedule = await prisma.schedule.create({
      data: {
        professionalLicense: profSpecialty.licenseNumber,
        locationId: location.id,
        classificationId: classification.id,
        slotDuration: 20,
      },
    });

    // Create a slot for today
    const now = new Date();
    const todaySlot = new Date(now);
    todaySlot.setHours(10, 0, 0, 0);

    await prisma.slot.create({
      data: {
        scheduleId: schedule.id,
        startsAt: todaySlot,
        status: "FREE",
      },
    });
  });

  afterEach(async () => {
    await prisma.slot.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.professionalSpecialty.deleteMany({});
    await prisma.classification.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { in: ["drilldown-prof@example.com"] },
      },
    });
    await prisma.specialty.deleteMany({
      where: { name: "Drilldown Test Specialty" },
    });
  });

  test("returns 200 and renders the drilldown grid for authenticated admin", async () => {
    const res = await request(app)
      .get(`/schedules/${schedule.id}/agenda`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Ana Martinez");
    expect(res.text).toContain("Drilldown Test Specialty");
    expect(res.text).toContain("Drilldown Clinic");
  });

  test("defaults to vista=hoy when no query param provided", async () => {
    const res = await request(app)
      .get(`/schedules/${schedule.id}/agenda`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    // The "Hoy" tab should be active (btn-primary class)
    expect(res.text).toContain("vista=hoy");
  });

  test("renders 3-day view when vista=3-dias", async () => {
    const today = new Date();
    const fecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const res = await request(app)
      .get(`/schedules/${schedule.id}/agenda?vista=3-dias&fecha=${fecha}`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("vista=3-dias");
  });

  test("renders week view when vista=semana", async () => {
    const today = new Date();
    const fecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const res = await request(app)
      .get(`/schedules/${schedule.id}/agenda?vista=semana&fecha=${fecha}`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("vista=semana");
  });

  test("date navigation links are present in the response", async () => {
    const res = await request(app)
      .get(`/schedules/${schedule.id}/agenda`)
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Anterior");
    expect(res.text).toContain("Siguiente");
  });

  test("returns 404 for non-existent schedule ID", async () => {
    const res = await request(app)
      .get("/schedules/999999/agenda")
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(404);
  });

  test("returns 401 for unauthenticated users", async () => {
    const res = await request(app).get(`/schedules/${schedule.id}/agenda`);

    // Usually returns 302 redirect to login or 401
    expect([401, 302]).toContain(res.status);
  });

  test("returns 400 for invalid schedule ID", async () => {
    const res = await request(app)
      .get("/schedules/abc/agenda")
      .set("Cookie", `access_token=${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("professional role can access drilldown view", async () => {
    const professionalUser = await prisma.user.findFirst({
      where: { email: "drilldown-prof@example.com" },
    });

    const profToken = generateToken({
      sub: professionalUser.id,
      role: Roles.PROFESSIONAL,
    });

    const res = await request(app)
      .get(`/schedules/${schedule.id}/agenda`)
      .set("Cookie", `access_token=${profToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Ana Martinez");
  });
});
