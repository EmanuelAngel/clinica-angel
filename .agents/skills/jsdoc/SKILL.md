---
name: jsdoc
description: >
  Standards for JSDoc typing within the project to ensure type safety in a vanilla JavaScript codebase.
  Trigger: When defining domain entities, repository interfaces, DTOs, or application services.
license: Apache-2.0
metadata:
  author: prowler-cloud
  version: "1.0"
---

## When to Use

- When creating or modifying **Domain Entities**.
- When defining **Repository Interfaces** in the domain layer.
- When typing **DTOs** (Data Transfer Objects) or schemas.
- When documenting **Application Services** (constructors and methods).
- Anytime you need to avoid `any` and provide clear type hints for the IDE.

## Critical Patterns

### 1. Repository Interfaces

Repositories should be defined as `@typedef {object}` using arrow function syntax with named parameters for properties.

```javascript
/**
 * @import { User } from "./user.model.js"
 */

/**
 * @typedef {object} UserRepository
 * @property {(user: User) => Promise<void>} register
 * Registers a new user with the given data.
 * @property {(email: string) => Promise<User | null>} findByEmail
 * Finds a user by email or returns null.
 */
```

### 2. Model/DTO Implementation

Use a `Props` typedef for constructor arguments.

```javascript
/**
 * @typedef {object} UserProps
 * @property {number} id
 * @property {string} email
 * @property {Date} [registeredAt] - Optional property
 */

export class User {
  /**
   * @param {UserProps} props
   */
  constructor(props) {
    this.id = props.id;
    // ...
  }
}
```

### 3. Dependency Injection in Services

Document the constructor to enable type-safe service instantiation.

```javascript
/**
 * @import { UserRepository } from "../domain/user.repository.js"
 */

export class UserService {
  /**
   * @param {UserRepository} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
}
```

### 4. `neverthrow` Result Pattern

Document methods that return `Result` objects carefully.

```javascript
/**
 * @import { Result } from "neverthrow"
 */

/**
 * @param {string} email
 * @returns {Promise<Result<User, UserNotFoundError>>}
 */
async getByEmail(email) {
  // ...
}
```

### 5. Avoiding `any`

- `any` is acceptable ONLY for **read operations** (e.g., complex queries with many joins where defining a full model is overkill).
- For **write operations** (creation, updates), `any` or plain `object` is **strictly PROHIBITED**. Use DTOs or explicit property definitions.

```javascript
// ACCEPTABLE (Read)
/** @property {() => Promise<any[]>} findAll */

// PROHIBITED (Write)
/** @param {any} data */
```

## Code Examples

### Importing Types

Avoid inline `import()`. Use `@import` at the top level of the file or above the documentation block.

```javascript
/**
 * @import { Result } from "neverthrow";
 * @import { User } from "../domain/user.model.js";
 */
```

### Documenting Errors

List potential errors in the method description for better readability.

```javascript
/**
 * Registers a new patient.
 * @param {PatientDTO} data
 * @returns {Promise<Result<
 * void,
 * EmailInUseError |
 * InvalidDataError
 * >>}
 * - `void`: If the patient was successfully registered.
 * - `EmailInUseError`: If the email is already registered.
 * - `InvalidDataError`: If the input validation fails.
 */
```

## Checklist

- [ ] No `any` used in **write operations**.
- [ ] Interfaces (repositories) are defined via `@typedef {object}`.
- [ ] Constructors use `Props` typedefs.
- [ ] `neverthrow` Results are explicitly typed with Success and Error types.
- [ ] External types are imported via `@import` instead of inline `import()`.
