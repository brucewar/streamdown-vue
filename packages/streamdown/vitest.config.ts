import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "__benchmarks__/",
        "*.config.ts",
        "*.config.js",
        "dist/",
        "../streamdown-math/**",
        "../streamdown-cjk/**",
        "**/streamdown-math/**",
        "**/streamdown-cjk/**",
      ],
    },
  },
});
