import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: "es2023",
      },
      module: {
        type: "es6",
      },
    }),
  ],
  test: {
    environment: "node",
    globals: true,
    hookTimeout: 30_000,
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    setupFiles: ["test/support/api-test-env.ts"],
    testTimeout: 30_000,
  },
});
