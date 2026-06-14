import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../app.vue";
import { canAccessProtectedRoute } from "../middleware/auth.js";

describe("index page", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
  });

  it("redirects the root route to the gallery", async () => {
    const component = await mountSuspended(App, {
      route: "/",
    });

    expect(component.text()).toContain("ConteAI Gallery");
  });

  it("keeps legacy gallery deep-link query values visible to the page", async () => {
    const component = await mountSuspended(App, {
      route:
        "/gallery?id=67b7eb60084f9f0679bb2b17&version=2&city=Taito&tag=Temple",
    });

    expect(component.get("[data-testid='gallery-route-id']").text()).toBe(
      "67b7eb60084f9f0679bb2b17",
    );
    expect(component.get("[data-testid='gallery-route-version']").text()).toBe(
      "2",
    );
    expect(component.get("[data-testid='gallery-route-city']").text()).toBe(
      "Taito",
    );
    expect(component.get("[data-testid='gallery-route-tag']").text()).toBe(
      "Temple",
    );
  });

  it("redirects protected route shells without a token", async () => {
    const login = await mountSuspended(App, { route: "/secretdoor" });
    const upload = await mountSuspended(App, { route: "/upload" });
    const list = await mountSuspended(App, { route: "/list" });

    expect(login.text()).toContain("Secret Door");
    expect(upload.text()).toContain("Secret Door");
    expect(list.text()).toContain("Secret Door");
  });

  it("allows protected routes only when the auth store has a token", () => {
    expect(canAccessProtectedRoute(null)).toBe(false);
    expect(canAccessProtectedRoute("jwt-token")).toBe(true);
  });
});
