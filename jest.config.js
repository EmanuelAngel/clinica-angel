/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {},
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/app.js",
    "!src/server.js",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
};

export default config;
