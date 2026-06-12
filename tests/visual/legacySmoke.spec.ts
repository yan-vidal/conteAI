import { expect, test } from "@playwright/test";
import {
  openLegacyRoute,
  seedLegacyTheme,
  waitForLegacyGallery,
} from "./legacy.helpers";

test.describe("legacy gallery smoke", () => {
  test("loads the public gallery from the production API", async ({ page }) => {
    await seedLegacyTheme(page, "dark");
    await openLegacyRoute(page, "/gallery");
    await waitForLegacyGallery(page);

    await expect(page.locator(".v-img").first()).toBeVisible();
  });

  test("keeps protected list read-only for anonymous capture", async ({
    page,
  }) => {
    await seedLegacyTheme(page, "dark");
    await openLegacyRoute(page, "/list");

    await expect(page).toHaveURL(/\/secretdoor$/);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });
});
