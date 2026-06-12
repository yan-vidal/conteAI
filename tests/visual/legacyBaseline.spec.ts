import { expect, type Page, test } from "@playwright/test";
import {
  openLegacyRoute,
  seedLegacyTheme,
  waitForLegacyGallery,
  waitForLegacyModal,
  waitForLegacyModalControls,
  waitForVisibleImages,
} from "./legacy.helpers";

const routes = {
  defaultGallery: "/gallery",
  japanTemple: "/gallery?country=Japan&state=Tokyo&city=Taito&tag=Temple",
  landscape: "/gallery?id=68ab9c4b992f13858f306ad5&version=1",
  portrait: "/gallery?id=68ab9be2992f13858f306a91&version=1",
  multiVersion: "/gallery?id=67b7eb60084f9f0679bb2b17&version=1",
  longDescription: "/gallery?id=670f6341b6130f8f74278a0d&version=1",
  originalOnly: "/gallery?id=66ee7a262e06e822f24eb968&version=original",
} as const;

test.describe("legacy visual baseline", () => {
  test("gallery default dark", async ({ page }) => {
    await openGallery(page, routes.defaultGallery, "dark");

    await expect(page).toHaveScreenshot("gallery-default-dark.png");
  });

  test("gallery default light", async ({ page }) => {
    await openGallery(page, routes.defaultGallery, "light");

    await expect(page).toHaveScreenshot("gallery-default-light.png");
  });

  test("gallery filtered", async ({ page }) => {
    await openGallery(page, routes.japanTemple, "dark");

    await expect(page).toHaveScreenshot("gallery-filtered-japan-temple.png");
  });

  test("modal landscape", async ({ page }) => {
    await openModal(page, routes.landscape);

    await expect(page).toHaveScreenshot("modal-landscape.png");
  });

  test("modal portrait", async ({ page }) => {
    await openModal(page, routes.portrait);

    await expect(page).toHaveScreenshot("modal-portrait.png");
  });

  test("modal details expanded", async ({ page }) => {
    await openModal(page, routes.longDescription);
    await revealModalChrome(page);
    await page.locator(".expansion-title").click();
    await expect(page.locator(".v-expansion-panel-text").first()).toBeVisible();

    await expect(page).toHaveScreenshot("modal-details-expanded.png");
  });

  test("modal rotated", async ({ page }) => {
    await openInteractiveModal(page);
    await page.locator(".nav-button.rotate").click();
    await expect(page.locator(".v-dialog .rotated").first()).toBeVisible();
    await waitForVisibleImages(page);

    await expect(page).toHaveScreenshot("modal-rotated.png");
  });

  test("modal multi-version delimiters", async ({ page }) => {
    await openModal(page, routes.multiVersion);
    await revealModalChrome(page);
    await expect(page.locator(".custom-delimiters").first()).toBeVisible();

    await expect(page).toHaveScreenshot("modal-multi-version.png");
  });

  test("modal original-only", async ({ page }) => {
    await openModal(page, routes.originalOnly);
    await revealModalChrome(page);
    await expect(page.locator(".no-edit-checkbox").first()).toBeVisible();

    await expect(page).toHaveScreenshot("modal-original-only.png");
  });

  test("login", async ({ page }) => {
    await seedLegacyTheme(page, "dark");
    await openLegacyRoute(page, "/secretdoor");
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

    await expect(page).toHaveScreenshot("login.png");
  });

  test("protected list redirect", async ({ page }) => {
    await seedLegacyTheme(page, "dark");
    await openLegacyRoute(page, "/list");
    await expect(page).toHaveURL(/\/secretdoor$/);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

    await expect(page).toHaveScreenshot("protected-list-redirect.png");
  });
});

async function openGallery(
  page: Page,
  route: string,
  theme: "dark" | "light",
): Promise<void> {
  await seedLegacyTheme(page, theme);
  await openLegacyRoute(page, route);
  await waitForLegacyGallery(page);
}

async function openModal(page: Page, route: string): Promise<void> {
  await openGallery(page, route, "dark");
  await waitForLegacyModal(page);
}

async function openInteractiveModal(page: Page): Promise<void> {
  await openGallery(page, routes.defaultGallery, "dark");
  await page.locator(".img-cols .v-img").first().click();
  await waitForLegacyModal(page);
  await waitForLegacyModalControls(page);
}

async function revealModalChrome(page: Page): Promise<void> {
  await page.locator(".v-dialog .v-card").first().hover({ force: true });
  await expect(page.locator(".expansion-panel").first()).toBeVisible();
}
