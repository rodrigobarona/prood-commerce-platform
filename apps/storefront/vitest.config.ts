import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname) } },
  oxc: { jsx: { runtime: "automatic" } },
  test: { environment: "jsdom", include: ["**/__tests__/*.test.{ts,tsx}"] },
})
