import { expect, type Page } from "@playwright/test";

export type WebTheme = "dark" | "light";
export type WebLocale = "en" | "pt-BR";

// The gallery/modal legacy goldens were captured with the legacy app's English
// filter labels, so those states seed "en". The legacy login was hardcoded in
// Portuguese, so the login states seed "pt-BR" (which is also the app's real
// defaultLocale) to compare like-for-like.
export async function seedWebTheme(
  page: Page,
  theme: WebTheme,
  locale: WebLocale = "en",
): Promise<void> {
  // The theme is persisted as a cookie by @pinia-plugin-persistedstate/nuxt
  // (default storage), not localStorage.
  await page.context().addCookies([
    {
      name: "conteai_locale",
      url: "http://127.0.0.1:3003",
      value: locale,
    },
    {
      name: "theme",
      url: "http://127.0.0.1:3003",
      value: encodeURIComponent(JSON.stringify({ dark: theme === "dark" })),
    },
  ]);
}

export async function openWebRoute(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: "networkidle" });
}

export async function waitForWebGallery(page: Page): Promise<void> {
  await expect(page.locator(".image-grid img").first()).toBeVisible({
    timeout: 60_000,
  });
  await waitForNoVisibleProgressIndicators(page);
  await waitForWebImages(page, ".image-grid img");
}

export async function waitForWebModal(page: Page): Promise<void> {
  await expect(page.getByTestId("modal-viewer")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("modal-image")).toBeVisible({
    timeout: 30_000,
  });
  await waitForWebImages(page, "[data-testid='modal-image']");
}

// The legacy goldens for the chrome-bearing states were captured with the
// modal info chrome revealed (the legacy modal shows it on hover/touch). The
// new modal mirrors that: hovering the stage exposes the expansion panel.
export async function revealWebModalChrome(page: Page): Promise<void> {
  await page.getByTestId("viewer-stage").hover();
  await expect(page.locator(".expansion-panel").first()).toBeVisible({
    timeout: 30_000,
  });
}

async function waitForWebImages(page: Page, selector: string): Promise<void> {
  await page.evaluate(async (imageSelector: string) => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const visibleImages = Array.from(
      document.querySelectorAll(imageSelector),
    ).filter((image): image is HTMLImageElement => {
      if (!(image instanceof HTMLImageElement)) {
        return false;
      }

      const rect = image.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < viewportHeight &&
        rect.left < viewportWidth
      );
    });

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
  }, selector);
}

async function waitForNoVisibleProgressIndicators(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      return Array.from(
        document.querySelectorAll(".v-progress-circular"),
      ).every((element) => {
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
      });
    },
    null,
    { timeout: 90_000 },
  );
}
