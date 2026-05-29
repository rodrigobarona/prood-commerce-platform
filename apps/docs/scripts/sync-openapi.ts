/**
 * Writes the Commerce API OpenAPI document from apps/api into apps/docs so
 * Fumadocs can render interactive API reference pages at build time.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildOpenApiDocument } from "../../api/lib/openapi"

const root = dirname(fileURLToPath(import.meta.url))
const outDir = join(root, "../openapi")
const outFile = join(outDir, "commerce.json")

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`)
console.log(`Wrote ${outFile}`)
