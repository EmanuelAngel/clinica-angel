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
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  maxWorkers: 1,
};

export default config;
