/**
 * Writes the Commerce API OpenAPI document from apps/api into apps/docs so
 * Fumadocs can render interactive API reference pages at build time.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildOpenApiDocument } from "../../api/lib/openapi"

const root = dirname(fileURLToPath(import.meta.url))
const outDir = join(root, "../openapi")
const outFile = join(outDir, "commerce.json")

mkdirSync(outDir, { recursive: true })
const next = `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`

if (process.argv.includes("--check")) {
  const current = readFileSync(outFile, "utf8")
  if (current !== next) {
    console.error(
      "OpenAPI docs snapshot is stale. Run `pnpm openapi:sync` and commit the result."
    )
    process.exit(1)
  }
  console.log(`OpenAPI docs snapshot is up to date: ${outFile}`)
} else {
  writeFileSync(outFile, next)
  console.log(`Wrote ${outFile}`)
}
