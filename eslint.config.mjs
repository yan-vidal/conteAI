import webConfig from "./apps/web/eslint.config.mjs";

export default [
  {
    ignores: [
      "apps/api/**",
      "packages/shared/**",
      "yan-site-api-node/**",
      "yan-site-front-vue/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      ".output/**",
      ".nuxt/**",
    ],
  },
  ...webConfig,
];
