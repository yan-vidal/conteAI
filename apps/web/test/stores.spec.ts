import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../stores/auth.js";
import { useThemeStore } from "../stores/theme.js";

const authenticate = vi.fn();

mockNuxtImport("useApi", () => {
  return () => ({ authenticate });
});

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authenticate.mockReset();
  });

  it("stores token and payload on successful login", async () => {
    authenticate.mockResolvedValue({
      payload: { exp: 1_782_000_000, id: "user-1", name: "yan" },
      token: "jwt-token",
    });
    const store = useAuthStore();

    await store.login({ name: "yan", password: "secret" });

    expect(store.token).toBe("jwt-token");
    expect(store.payload?.name).toBe("yan");
    expect(store.isAuthenticated).toBe(true);
  });

  it("clears the session on logout", () => {
    const store = useAuthStore();
    store.token = "jwt-token";

    store.logout();

    expect(store.token).toBeNull();
    expect(store.payload).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });
});

describe("theme store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("defaults to dark and toggles", () => {
    const store = useThemeStore();

    expect(store.dark).toBe(true);
    expect(store.vuetifyTheme).toBe("dark");

    store.toggle();

    expect(store.dark).toBe(false);
    expect(store.vuetifyTheme).toBe("light");
  });
});
