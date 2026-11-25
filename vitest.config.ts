import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Next resolves this marker through its own bundler; vitest does not, so
      // any module carrying `import "server-only"` would fail to resolve here.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    // .claude holds agent worktrees — separate checkouts of this same repo.
    // Without this they get collected too, running every test twice.
    exclude: ["**/node_modules/**", "**/.next/**", "**/.claude/**"],
  },
});
