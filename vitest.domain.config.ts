import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/test/**/*.test.ts",
      "src/domain/**/*.test.ts",
      "src/application/**/*.test.ts",
      "src/infrastructure/**/*.test.ts",
    ],
    globals: false,
  },
});
