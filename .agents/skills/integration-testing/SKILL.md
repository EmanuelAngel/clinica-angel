---
name: integration-testing
description: >
  Patterns and best practices for writing integration tests in clinica-angel.
  Trigger: When creating or modifying *.int.test.js files, testing Express routes, or setting up test data with Prisma.
license: MIT
metadata:
  author: angel-emanuel
  version: "1.0"
---

## When to Use

Use this skill when:

- Adding integration tests for new features.
- Testing API endpoints or SSR controllers.
- Validating business rules that involve a database.
- Testing file uploads or authentication-protected routes.

## Critical Patterns

### 1. Test Setup & Tools

- **Framework**: Use `supertest` to hit endpoints.
- **Database**: Use the shared `prisma` client (`src/_shared/infrastructure/prisma.js`).
- **File Naming**: Always use the `.int.test.js` suffix for integration tests.
- **Imports**:
  ```javascript
  import request from "supertest";
  import app from "../../app.js";
  import { prisma } from "../../_shared/infrastructure/prisma.js";
  import { generateToken } from "../../auth/infrastructure/jwt.js";
  import { Roles } from "../../auth/domain/roles.js";
  ```

### 2. Authentication

Most routes are protected by roles. Simulate authentication by setting a cookie:

```javascript
const adminToken = generateToken({ sub: 999, role: Roles.ADMIN });

const response = await request(app)
  .post("/some-endpoint")
  .set("Cookie", `access_token=${adminToken}`)
  .send(payload);
```

### 3. Handling File Uploads

For endpoints using `multer` (like patient registration), use `.field()` and `.attach()` instead of `.send()`:

```javascript
const imageBuffer = Buffer.from("..."); // Min valid PNG or mock data
const response = await request(app)
  .post("/patients")
  .field("email", "test@test.com")
  .attach("nationalIdImage", imageBuffer, "test-id.png");
```

### 4. Filesystem Cleanup

If a test creates files (uploads), ALWAYS clean them up in `afterEach`:

```javascript
import { unlink } from "node:fs/promises";
import { join } from "node:path";

afterEach(async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: testEmails } },
  });
  for (const user of users) {
    if (user.nationalIdImageUrl) {
      const filename = user.nationalIdImageUrl.replace(/^\/uploads\//, "");
      const filePath = join("src", "_assets", "uploads", filename);
      try {
        await unlink(filePath);
      } catch {}
    }
  }
});
```

### 5. Verification

Don't just check status codes. Verify the database state after mutations:

```javascript
expect(response.status).toBe(201);
const stored = await prisma.specialty.findFirst({
  where: { name: "Neurología" },
});
expect(stored).not.toBeNull();
```

## Code Examples

### Standard CRUD Post

```javascript
test("creates a resource successfully", async () => {
  const res = await request(app)
    .post("/items")
    .set("Cookie", `access_token=${token}`)
    .send({ name: "Testing" });

  expect(res.status).toBe(201);
  expect(res.text).toContain("creado correctamente");
});
```

### Testing Validation Errors (Zod/422)

```javascript
test("returns 422 when data is invalid", async () => {
  const res = await request(app)
    .post("/items")
    .set("Cookie", `access_token=${token}`)
    .send({ name: "" }); // Empty name

  expect(res.status).toBe(422);
});
```

## Commands

```bash
# Run all integration tests
pnpm test

# Run a specific test file
pnpm test src/users/infrastructure/user-register.int.test.js

# Run tests matching a pattern
pnpm test -t "registers a user"
```
