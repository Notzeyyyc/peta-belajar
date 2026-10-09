import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    env: {
      AI_MOCK: "true",
      DATABASE_URL: "./data/test.db",
      AI_RATE_LIMIT_PER_MIN: "1000",
    },
  },
});
