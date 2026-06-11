import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2026-06-11",
  devServer: {
    port: 3001,
  },
  modules: ["vuetify-nuxt-module", "@pinia/nuxt", "@nuxtjs/i18n"],
  css: ["@mdi/font/css/materialdesignicons.css"],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? "http://localhost:3000",
    },
  },
  i18n: {
    defaultLocale: "pt-BR",
    strategy: "no_prefix",
    bundle: {
      optimizeTranslationDirective: false,
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "conteai_locale",
      redirectOn: "root",
    },
    locales: [
      {
        code: "pt-BR",
        name: "Português",
        file: "pt-BR.json",
      },
      {
        code: "en",
        name: "English",
        file: "en.json",
      },
    ],
    langDir: "locales",
  },
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: "dark",
        themes: {
          light: {
            colors: {
              background: "#FFFFFF",
              surface: "#F2F2F2",
              primary: "#6200EE",
              secondary: "#03DAC6",
              accent: "#FFC107",
              error: "#B00020",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#FB8C00",
              gradientone: "#F8FFAE",
              gradienttwo: "#C5796D",
              gradientthree: "#DBE6F6",
            },
          },
          dark: {
            dark: true,
            colors: {
              background: "#121212",
              surface: "#121212",
              primary: "#BB86FC",
              secondary: "#03DAC6",
              accent: "#FFC107",
              error: "#CF6679",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#FB8C00",
              gradientone: "#2a1933",
              gradienttwo: "#412b23",
              gradientthree: "#424152",
            },
          },
        },
      },
    },
  },
  typescript: {
    strict: true,
  },
});
