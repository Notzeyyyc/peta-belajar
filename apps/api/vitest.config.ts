import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    // Semua file tes memakai ./data/test.db yang dibersihkan setup.ts →
    // jalankan file berurutan supaya tidak saling hapus antar worker.
    fileParallelism: false,
    env: {
      AI_MOCK: "true",
      DATABASE_URL: "./data/test.db",
      AI_RATE_LIMIT_PER_MIN: "1000",
    },
  },
});
