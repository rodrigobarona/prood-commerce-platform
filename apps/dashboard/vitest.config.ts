import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // tsconfig keeps JSX for Next.js to compile, so tests compile it here.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": resolve(import.meta.dirname) } },
})
