/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
    related: false,
  },
  coverageAnalysis: "perTest",
  ignoreStatic: true,
  mutate: [
    "src/lib/classification-engine.ts",
    "src/lib/doc-generator.ts",
    "src/lib/store.ts",
    "src/lib/wizard-questions.ts",
    "src/middleware.ts",
  ],
  // Focus on business-critical logic — skip UI components for speed
  ignorePatterns: [
    "node_modules",
    "e2e",
    "coverage",
    "dist",
    ".next",
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  timeoutMS: 30000,
  timeoutFactor: 2.5,
  concurrency: 4,
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },
  tempDirName: ".stryker-tmp",
};

export default config;
