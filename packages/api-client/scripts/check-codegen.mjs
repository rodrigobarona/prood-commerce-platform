#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const outDir = mkdtempSync(join(tmpdir(), "prood-api-client-"))
const generated = join(outDir, "schema.ts")

try {
  execFileSync(
    "pnpm",
    [
      "exec",
      "openapi-typescript",
      "../../apps/docs/openapi/commerce.json",
      "-o",
      generated,
    ],
    { stdio: "inherit" }
  )

  let current
  try {
    current = readFileSync("src/schema.ts", "utf8")
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.error(
        "API client schema not found — run `pnpm --filter @prood/api-client codegen`"
      )
      process.exit(1)
    }
    throw error
  }
  const next = readFileSync(generated, "utf8")
  if (current !== next) {
    console.error(
      "API client schema is stale. Run `pnpm --filter @prood/api-client codegen` and commit the result."
    )
    process.exit(1)
  }

  console.log("API client schema is up to date: packages/api-client/src/schema.ts")
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
