import { defineConfig, devices } from "@playwright/test";

const chromeExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  "/usr/bin/google-chrome-stable";
const apiUrl =
  process.env.NUXT_PUBLIC_API_URL ??
  process.env.LEGACY_API_URL ??
  "https://api.yanlucas.com";

const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-landscape", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 768 },
  { name: "wide", width: 1920, height: 1080 },
] as const;

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: /webPort.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
  },
  snapshotPathTemplate:
    "{testDir}/goldens/legacy/{projectName}/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:3003",
    browserName: "chromium",
    deviceScaleFactor: 1,
    launchOptions: {
      executablePath: chromeExecutablePath,
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter web exec nuxt dev --host 127.0.0.1 --port 3003",
    env: {
      NUXT_DEVTOOLS: "false",
      NUXT_PUBLIC_API_URL: apiUrl,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:3003/gallery",
  },
  projects: viewports.map((viewport) => ({
    name: viewport.name,
    use: {
      ...devices["Desktop Chrome"],
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    },
  })),
});
