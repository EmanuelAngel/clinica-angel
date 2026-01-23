# Repository Guidelines

## Available Skills

Use these skills for detailed patterns on-demand:

| Skill                 | Description                            | URL                                             |
| --------------------- | -------------------------------------- | ----------------------------------------------- |
| `skill-creator`       | Create new AI agent skills             | [SKILL.md](skills/skill-creator/SKILL.md)       |
| `nunjucks-views`      | Patterns for Nunjucks templates and UI | [SKILL.md](skills/nunjucks-views/SKILL.md)      |
| `integration-testing` | Patterns for integration tests (Jest)  | [SKILL.md](skills/integration-testing/SKILL.md) |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                             | Skill                 |
| ---------------------------------- | --------------------- |
| Create new AI agent skill          | `skill-creator`       |
| Create or modify a view            | `nunjucks-views`      |
| Create or modify integration tests | `integration-testing` |

---

## Project Overview

`clinica-angel` is a university project for a Clinic Appointment Scheduler. It is a monolithic Node.js web application that uses Server-Side Rendering (SSR) for the frontend and exposes an internal API.

The project follows a **Modular Architecture** (Vertical Slicing), where each major feature (e.g., `auth`, `users`, `patients`) is self-contained with its own layers.

| Component | Location                 | Tech Stack                         |
| --------- | ------------------------ | ---------------------------------- |
| Backend   | `src/`                   | Node.js, Express, Prisma (MariaDB) |
| Frontend  | `src/{slice}/views/`     | Nunjucks, Tailwind CSS, DaisyUI    |
| Database  | `prisma/`                | Prisma Schema                      |
| Tests     | `src/**/*.{int}.test.js` | Jest                               |

---

## Node.js Development

```bash
# Setup
pnpm install
pnpm dlx prisma generate
pnpm dev

# Code quality
pnpm lint:fix
pnpm format
```

---

## Commit Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`
