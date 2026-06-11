import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import App from "../app.vue";

describe("index page", () => {
  it("renders the localized SSR entry copy", async () => {
    const component = await mountSuspended(App, {
      route: "/",
    });

    expect(component.text()).toMatch(/ConteAI (Fotografia|Photography)/);
  });
});
