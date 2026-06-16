import { expect, type Page, test } from "@playwright/test";
import {
  openWebRoute,
  revealWebModalChrome,
  seedWebTheme,
  waitForWebGallery,
  waitForWebModal,
} from "./web-port.helpers";

const routes = {
  defaultGallery: "/gallery?all=true",
  japanTemple:
    "/gallery?all=true&country=Japan&state=Tokyo&city=Taito&tag=Temple",
  landscape: "/gallery?all=true&id=68ab9c4b992f13858f306ad5&version=1",
  portrait: "/gallery?all=true&id=68ab9be2992f13858f306a91&version=1",
  multiVersion: "/gallery?all=true&id=67b7eb60084f9f0679bb2b17&version=1",
  longDescription: "/gallery?all=true&id=670f6341b6130f8f74278a0d&version=1",
  originalOnly:
    "/gallery?all=true&id=66ee7a262e06e822f24eb968&version=original",
} as const;

// The gallery is a full-viewport grid of remote photos. Layout, ordering and
// content match the legacy baseline exactly; the small residual is intrinsic
// sub-pixel decode noise of the same photos rendered through a plain <img>
// instead of Vuetify's v-img (worst on the smallest mobile tiles, ~0.03).
const GALLERY_SNAPSHOT = { maxDiffPixelRatio: 0.04 } as const;

// The modal chrome (EXIF panel, delimiters, version checkbox, location/date
// menus) is a faithful Vuetify port of the legacy modal. Per RV5 the chrome
// diverges by construction (Vuetify paddings/shadows), strongest on the
// smallest viewports; the photo itself stays pixel-faithful. These states are
// consciously accepted with a calibrated threshold.
const CHROME_SNAPSHOT = { maxDiffPixelRatio: 0.05 } as const;

test.describe("web port visual comparison", () => {
  test("gallery default dark", async ({ page }) => {
    await openGallery(page, routes.defaultGallery, "dark");

    await expect(page).toHaveScreenshot(
      "gallery-default-dark.png",
      GALLERY_SNAPSHOT,
    );
  });

  test("gallery default light", async ({ page }) => {
    await openGallery(page, routes.defaultGallery, "light");

    await expect(page).toHaveScreenshot(
      "gallery-default-light.png",
      GALLERY_SNAPSHOT,
    );
  });

  test("gallery filtered", async ({ page }) => {
    await openGallery(page, routes.japanTemple, "dark");

    await expect(page).toHaveScreenshot(
      "gallery-filtered-japan-temple.png",
      GALLERY_SNAPSHOT,
    );
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
    await revealWebModalChrome(page);
    await page.locator(".expansion-title").click();
    await expect(page.locator(".v-expansion-panel-text").first()).toBeVisible();

    await expect(page).toHaveScreenshot(
      "modal-details-expanded.png",
      CHROME_SNAPSHOT,
    );
  });

  test("modal rotated", async ({ page }) => {
    await openInteractiveModal(page);
    await page.getByTestId("rotate-image").click();
    await expect(page.getByTestId("viewer-stage")).toHaveClass(/rotated/);
    await waitForVisibleModalImage(page);
    await revealWebModalChrome(page);

    await expect(page).toHaveScreenshot("modal-rotated.png", CHROME_SNAPSHOT);
  });

  test("modal multi-version delimiters", async ({ page }) => {
    await openModal(page, routes.multiVersion);
    await revealWebModalChrome(page);
    await expect(page.locator(".custom-delimiters").first()).toBeVisible();

    await expect(page).toHaveScreenshot(
      "modal-multi-version.png",
      CHROME_SNAPSHOT,
    );
  });

  test("modal original-only", async ({ page }) => {
    await openModal(page, routes.originalOnly);
    await revealWebModalChrome(page);
    await expect(page.locator(".no-edit-checkbox").first()).toBeVisible();

    await expect(page).toHaveScreenshot(
      "modal-original-only.png",
      CHROME_SNAPSHOT,
    );
  });

  test("login", async ({ page }) => {
    // Legacy login was Portuguese; seed pt-BR (also the app's defaultLocale).
    await seedWebTheme(page, "dark", "pt-BR");
    await openWebRoute(page, "/secretdoor");
    await expect(
      page.getByRole("heading", { name: "Secret Door" }),
    ).toBeVisible();

    await expect(page).toHaveScreenshot("login.png");
  });

  test("protected list redirect", async ({ page }) => {
    await seedWebTheme(page, "dark", "pt-BR");
    await openWebRoute(page, "/list");
    await expect(page).toHaveURL(/\/secretdoor$/);
    await expect(
      page.getByRole("heading", { name: "Secret Door" }),
    ).toBeVisible();

    await expect(page).toHaveScreenshot("protected-list-redirect.png");
  });
});

async function openGallery(
  page: Page,
  route: string,
  theme: "dark" | "light",
): Promise<void> {
  await seedWebTheme(page, theme);
  await openWebRoute(page, route);
  await waitForWebGallery(page);
}

async function openModal(page: Page, route: string): Promise<void> {
  await openGallery(page, route, "dark");
  await waitForWebModal(page);
}

async function openInteractiveModal(page: Page): Promise<void> {
  await openGallery(page, routes.defaultGallery, "dark");
  await page.locator(".image-button").first().click();
  await waitForWebModal(page);
  await expect(page.getByTestId("rotate-image")).toBeEnabled({
    timeout: 30_000,
  });
}

async function waitForVisibleModalImage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const image = document.querySelector("[data-testid='modal-image']");

    if (!(image instanceof HTMLImageElement) || image.complete) {
      return;
    }

    await new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  });
}
