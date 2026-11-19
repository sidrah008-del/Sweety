
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  reporter: "list",

  globalSetup: "./tests/setup-env.cjs",

  use: {
    browserName: "chromium",
    headless: false,
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
