import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    // UI tests opt into jsdom per-file via `// @vitest-environment jsdom`.
    css: false,
  },
});
