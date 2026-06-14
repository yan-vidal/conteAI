import type { AuthPayload } from "@conteai/shared";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { LoginCredentials } from "../composables/useApi.js";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string | null>(null);
    const payload = ref<AuthPayload | null>(null);
    const isAuthenticated = computed(() => token.value !== null);

    const login = async (credentials: LoginCredentials): Promise<void> => {
      const { authenticate } = useApi();
      const response = await authenticate(credentials);
      token.value = response.token;
      payload.value = response.payload;
    };

    const logout = (): void => {
      token.value = null;
      payload.value = null;
    };

    return { isAuthenticated, login, logout, payload, token };
  },
  { persist: true },
);
