import { expect, type Page } from "@playwright/test";

export type LegacyTheme = "dark" | "light";

export async function openLegacyRoute(
  page: Page,
  route: string,
): Promise<void> {
  await installLegacySpaFallback(page);
  await page.goto(route, { waitUntil: "domcontentloaded" });
}

async function installLegacySpaFallback(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    const routePaths = ["/gallery", "/secretdoor", "/list"];
    const shouldServeAppShell =
      route.request().resourceType() === "document" &&
      routePaths.includes(requestUrl.pathname);

    if (!shouldServeAppShell) {
      await route.continue();
      return;
    }

    const response = await route.fetch({
      url: `${requestUrl.origin}/`,
    });
    await route.fulfill({ response });
  });
}

export async function waitForLegacyRoute(
  page: Page,
  pathname: string,
): Promise<void> {
  await page.waitForURL((url) => url.pathname === pathname, {
    timeout: 20_000,
  });
}

export async function waitForLegacyGalleryRoute(page: Page): Promise<void> {
  if (new URL(page.url()).pathname === "/gallery") {
    return;
  }

  await waitForLegacyRoute(page, "/gallery");
}

export async function seedLegacyTheme(
  page: Page,
  theme: LegacyTheme,
): Promise<void> {
  await page.addInitScript((darkTheme) => {
    localStorage.setItem(
      "vuex",
      JSON.stringify({
        user: {},
        darkTheme,
      }),
    );
  }, theme === "dark");
}

export async function waitForLegacyGallery(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll(".v-img").length > 0,
    null,
    { timeout: 60_000 },
  );
  await expect(page.locator(".v-img").first()).toBeVisible({
    timeout: 30_000,
  });
  await waitForNoVisibleProgressIndicators(
    page,
    ".v-infinite-scroll .v-progress-circular",
  );
  await waitForVisibleImages(page);
}

export async function waitForLegacyModal(page: Page): Promise<void> {
  await expect(page.locator(".v-dialog .v-carousel").first()).toBeVisible({
    timeout: 30_000,
  });
  await waitForNoVisibleProgressIndicators(
    page,
    ".v-dialog .v-carousel .v-progress-circular",
  );
  await waitForVisibleImages(page);
}

export async function waitForLegacyModalControls(page: Page): Promise<void> {
  await expect(page.locator(".nav-button.rotate")).toBeEnabled({
    timeout: 90_000,
  });
}

export async function waitForVisibleImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const visibleImages = Array.from(document.images).filter(
      (image) => image.getClientRects().length > 0,
    );

    await Promise.all(
      visibleImages.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }

            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  });
}

async function waitForNoVisibleProgressIndicators(
  page: Page,
  selector: string,
): Promise<void> {
  await page.waitForFunction(
    (progressSelector: string) => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      return Array.from(document.querySelectorAll(progressSelector)).every(
        (element) => {
          if (!(element instanceof HTMLElement)) {
            return true;
          }

          const style = window.getComputedStyle(element);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
          ) {
            return true;
          }

          const rect = element.getBoundingClientRect();
          const isInViewport =
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < viewportHeight &&
            rect.left < viewportWidth;

          return !isInViewport;
        },
      );
    },
    selector,
    { timeout: 90_000 },
  );
}
