# Gemini Context: Clinica Angel

## Project Overview

`clinica-angel` is a university project for a Clinic Appointment Scheduler. It is a monolithic Node.js web application that uses Server-Side Rendering (SSR) for the frontend and exposes an internal API.

The project follows a **Modular Architecture** (Vertical Slicing), where each major feature (e.g., `auth`, `users`, `patients`) is self-contained with its own layers.

## Architecture & Conventions

### Directory Structure

The codebase is organized by **Feature Modules**:

- `src/_shared/`: Common code used across modules (Database connection, global errors, base views).
- `src/<feature>/`: (e.g., `src/users/`)
  - `domain/`: Pure business logic, entity models, and repository interfaces (defined via JSDoc). **No external dependencies** (except maybe utility libs).
  - `application/`: Service layer implementing use cases. Orchestrates domain objects and repositories.
  - `infrastructure/`: Framework-specific code. Database implementations (Prisma), HTTP controllers, Routers, DTO schemas.
  - `views/`: Nunjucks templates (`.njk`) for UI.

### Key Technologies

- **Runtime:** Node.js (ES Modules enabled).
- **Framework:** Express.js.
- **ORM:** Prisma (connected to MariaDB).
- **Templating:** Nunjucks.
- **Styling:** Tailwind CSS (processed via `@tailwindcss/cli`).
- **Validation:** Zod.
- **Error Handling:** `neverthrow` (Result Pattern).
- **Testing:** Jest.

## Development Workflow

### Prerequisites

- Node.js (Latest LTS recommended)
- PNPM (Package Manager)
- MariaDB instance

### Common Commands

- **Start Development:** `pnpm run dev` (Runs with Nodemon)
- **Start Production:** `pnpm start`
- **Build CSS:** `pnpm run css:build` (Tailwind)
- **Watch CSS:** `pnpm run css:watch`
- **Run Tests:** `pnpm test`
- **Linting:** `pnpm run lint` / `pnpm run lint:fix`
- **Database:**
  - Seed: `pnpm run db:seed`
  - Studio: `npx prisma studio`
  - Migrate: `npx prisma migrate dev`

### Coding Standards

- **JSDoc Types:** The project uses JSDoc heavily for typing, especially for defining Repository interfaces in the `domain` layer.
- **Dependency Injection:** Services receive their dependencies (repositories) via constructor injection.
- **Error Handling & Result Pattern:** The project uses the **Result Pattern** (via `neverthrow`) for handling expected business logic errors in the application layer. Services return `Result<T, E>` instead of throwing. Controllers handle these results using `.match()`. `CustomError` (from `src/_shared/domain/custom-error.js`) is used as the base for these error types. Unexpected errors or infrastructure-level failures are still caught by `express-async-errors` and handled by the `globalErrorHandler`.
- **Formatting:** Prettier and ESLint are enforced via Husky pre-commit hooks.

## Key Files

- `src/app.js`: Main Express application setup, middleware, and view engine configuration.
- `prisma/schema.prisma`: Database schema definition.
- `src/_shared/infrastructure/prisma.js`: Prisma client instance.
- `src/_shared/infrastructure/services-container.js`: Central dependency injection point. Instantiates repositories and services, wiring them together, and exports a `services` object for use in controllers.
