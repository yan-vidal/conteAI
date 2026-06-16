import { defineNuxtRouteMiddleware, navigateTo } from "#imports";
import { useAuthStore } from "../stores/auth.js";

export const canAccessProtectedRoute = (token: string | null): boolean =>
  token !== null;

export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();

  if (canAccessProtectedRoute(auth.token)) {
    return;
  }

  return navigateTo("/secretdoor");
});
