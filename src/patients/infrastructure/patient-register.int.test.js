import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../_shared/infrastructure/prisma.js";
import { Roles } from "../../auth/domain/roles.js";

describe("Patient register integration", () => {
  const validPayload = {
    email: "patient@example.com",
    password: "StrongPass123",
    firstNames: "John",
    lastNames: "Doe",
    nationalId: "12345678",
    phone: "1234567890",
    address: "123 Main Street",
  };

  // Helper to create a valid image buffer (small PNG)
  function createValidImageBuffer() {
    // Minimal valid PNG file (1x1 pixel PNG)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x0f, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5c, 0xc3, 0xa9, 0xdc, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    return pngHeader;
  }

  // Helper to create a large buffer (> 5MB)
  function createLargeBuffer() {
    return Buffer.alloc(5 * 1024 * 1024 + 1); // 5MB + 1 byte
  }

  // Helper to create an invalid file buffer (PDF-like)
  function createInvalidFileBuffer() {
    return Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj");
  }

  test("registers a patient successfully with valid data", async () => {
    // Create a health insurance for the test
    const healthInsurance = await prisma.healthInsurance.create({
      data: {
        name: "Test Insurance",
      },
    });

    const imageBuffer = createValidImageBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .field("healthInsuranceId", healthInsurance.id.toString())
      .field("memberNumber", "12345")
      .attach("nationalIdImage", imageBuffer, "test-id.png");

    expect(response.status).toBe(201);

    // Verify patient is stored in database
    const stored = await prisma.user.findUnique({
      where: { email: validPayload.email.toLowerCase() },
      include: {
        patientInsurances: {
          include: {
            insurance: true,
          },
        },
      },
    });

    expect(stored).not.toBeNull();
    expect(stored?.role).toBe(Roles.PATIENT);
    expect(stored?.nationalIdImageUrl).not.toBeNull();
    expect(stored?.nationalIdImageUrl).toMatch(/^\/uploads\//);
    expect(stored?.patientInsurances).toHaveLength(1);
    expect(stored?.patientInsurances[0].insuranceId).toBe(healthInsurance.id);
    expect(stored?.patientInsurances[0].memberNumber).toBe("12345");
  });

  test("returns 422 when national ID image is not uploaded", async () => {
    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address);

    expect(response.status).toBe(422);
  });

  test("returns 422 when file size exceeds 5MB", async () => {
    const largeBuffer = createLargeBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .attach("nationalIdImage", largeBuffer, "large-file.png");

    expect(response.status).toBe(422);
  });

  test("returns 422 when file type is invalid", async () => {
    const invalidBuffer = createInvalidFileBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .attach("nationalIdImage", invalidBuffer, "document.pdf");

    expect(response.status).toBe(422);
  });

  test("returns 409 when user with patient role and same national ID already exists", async () => {
    // Create an existing patient with the same national ID
    await prisma.user.create({
      data: {
        email: "existing@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Existing",
        lastNames: "Patient",
        nationalId: validPayload.nationalId,
        phone: "9876543210",
        address: "456 Other Street",
        nationalIdImageUrl: "/uploads/existing-id.png",
      },
    });

    const imageBuffer = createValidImageBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .attach("nationalIdImage", imageBuffer, "test-id.png");

    expect(response.status).toBe(409);
  });

  test("returns 409 when email is already occupied", async () => {
    // Create an existing patient with the same email
    await prisma.user.create({
      data: {
        email: validPayload.email,
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Existing",
        lastNames: "Patient",
        nationalId: "99999999",
        phone: "9876543210",
        address: "456 Other Street",
        nationalIdImageUrl: "/uploads/existing-id.png",
      },
    });

    const imageBuffer = createValidImageBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .attach("nationalIdImage", imageBuffer, "test-id.png");

    expect(response.status).toBe(409);
  });

  test("returns 404 when health insurance does not exist", async () => {
    const imageBuffer = createValidImageBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .field("healthInsuranceId", "99999")
      .field("memberNumber", "12345")
      .attach("nationalIdImage", imageBuffer, "test-id.png");

    expect(response.status).toBe(404);
  });

  test("returns 409 when member number already exists for the same insurance", async () => {
    // Create a health insurance
    const healthInsurance = await prisma.healthInsurance.create({
      data: {
        name: "Test Insurance",
      },
    });

    // Create an existing patient with the same insurance and member number
    const existingPatient = await prisma.user.create({
      data: {
        email: "existing@example.com",
        passwordHash: "hashed",
        role: Roles.PATIENT,
        firstNames: "Existing",
        lastNames: "Patient",
        nationalId: "99999999",
        phone: "9876543210",
        address: "456 Other Street",
        nationalIdImageUrl: "/uploads/existing-id.png",
      },
    });

    await prisma.patientHealthInsurance.create({
      data: {
        userId: existingPatient.id,
        insuranceId: healthInsurance.id,
        memberNumber: "12345",
      },
    });

    const imageBuffer = createValidImageBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .field("healthInsuranceId", healthInsurance.id.toString())
      .field("memberNumber", "12345")
      .attach("nationalIdImage", imageBuffer, "test-id.png");

    expect(response.status).toBe(409);
  });

  test("ensures patient has nationalIdImageUrl set after registration", async () => {
    const healthInsurance = await prisma.healthInsurance.create({
      data: {
        name: "Test Insurance",
      },
    });

    const imageBuffer = createValidImageBuffer();

    const response = await request(app)
      .post("/patients")
      .field("email", validPayload.email)
      .field("password", validPayload.password)
      .field("firstNames", validPayload.firstNames)
      .field("lastNames", validPayload.lastNames)
      .field("nationalId", validPayload.nationalId)
      .field("phone", validPayload.phone)
      .field("address", validPayload.address)
      .field("healthInsuranceId", healthInsurance.id.toString())
      .field("memberNumber", "12345")
      .attach("nationalIdImage", imageBuffer, "test-id.png");

    expect(response.status).toBe(201);

    // Verify nationalIdImageUrl is set
    const stored = await prisma.user.findUnique({
      where: { email: validPayload.email.toLowerCase() },
    });

    expect(stored?.nationalIdImageUrl).not.toBeNull();
    expect(stored?.nationalIdImageUrl).toBeDefined();
    expect(typeof stored?.nationalIdImageUrl).toBe("string");
    expect(stored?.nationalIdImageUrl?.length).toBeGreaterThan(0);
  });
});
