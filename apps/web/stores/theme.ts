import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useThemeStore = defineStore(
  "theme",
  () => {
    const dark = ref(true);
    const vuetifyTheme = computed<"dark" | "light">(() =>
      dark.value ? "dark" : "light",
    );

    const toggle = (): void => {
      dark.value = !dark.value;
    };

    const set = (value: boolean): void => {
      dark.value = value;
    };

    return { dark, set, toggle, vuetifyTheme };
  },
  { persist: true },
);
