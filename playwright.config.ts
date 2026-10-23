import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts/browser",
  outputDir: "./output/playwright",
  use: { baseURL: "http://127.0.0.1:4197" },
  webServer: {
    command: "pnpm --filter @509-trueohm/web dev --host 127.0.0.1 --port 4197 --strictPort",
    url: "http://127.0.0.1:4197",
    reuseExistingServer: false,
  },
  projects: [
    { name: "phone", use: { viewport: { width: 393, height: 852 } } },
    { name: "tablet", use: { viewport: { width: 1024, height: 1366 } } },
  ],
});
