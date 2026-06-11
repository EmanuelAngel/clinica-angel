/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {},
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/app.js",
    "!src/server.js",
    "!src/_shared/infrastructure/env-variables.js",
    "!src/_shared/infrastructure/prisma.js",
    "!src/_shared/infrastructure/services-container.js",
    "!src/_shared/infrastructure/links.js",
    "!src/**/infrastructure/*.routes.js",
    "!src/**/infrastructure/prisma-*.repository.js",
    "!src/**/views/**",
    "!src/_assets/js/**",
    "!**/generated/**",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  verbose: false,
  setupFiles: ["<rootDir>/tests/test-env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  maxWorkers: 1,
};

export default config;
