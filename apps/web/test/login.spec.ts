import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "#imports";
import App from "../app.vue";
import { useAuthStore } from "../stores/auth.js";

const authenticate = vi.fn();

mockNuxtImport("useApi", () => {
  return () => ({ authenticate });
});

describe("login page", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
    authenticate.mockReset();
    useAuthStore().logout();
  });

  it("authenticates and redirects to the image list", async () => {
    authenticate.mockResolvedValue({
      payload: { exp: 1_782_000_000, id: "user-1", name: "yan" },
      token: "jwt-token",
    });

    const component = await mountSuspended(App, { route: "/secretdoor" });
    const push = vi.spyOn(useRouter(), "push");

    await component.find('input[name="name"]').setValue("yan");
    await component.find('input[name="password"]').setValue("secret");
    await component.find("form").trigger("submit");
    await flushPromises();

    const auth = useAuthStore();
    expect(auth.token).toBe("jwt-token");
    expect(auth.payload?.name).toBe("yan");
    expect(authenticate).toHaveBeenCalledWith({
      name: "yan",
      password: "secret",
    });
    expect(push).toHaveBeenCalledWith("/list");
  });

  it("shows an error when credentials are rejected", async () => {
    authenticate.mockRejectedValue(new Error("invalid credentials"));

    const component = await mountSuspended(App, { route: "/secretdoor" });

    await component.find('input[name="name"]').setValue("yan");
    await component.find('input[name="password"]').setValue("wrong");
    await component.find("form").trigger("submit");
    await flushPromises();

    expect(useAuthStore().isAuthenticated).toBe(false);
    expect(component.text()).toContain("Usuário não encontrado ou senha incorreta");
    expect(component.text()).toContain("Secret Door");
  });
});
