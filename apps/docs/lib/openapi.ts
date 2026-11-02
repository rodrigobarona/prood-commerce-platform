import type { Document } from "fumadocs-openapi"
import { createOpenAPI } from "fumadocs-openapi/server"
import spec from "@/openapi/commerce.json"

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.prood.com").replace(/\/$/, "")

export const openapi = createOpenAPI({
  input: {
    // The spec's server is relative to the API, and these pages aren't served from it.
    // Fumadocs upgrades the 3.1 document on load, so JSON's types can't describe it.
    commerce: () => ({ ...spec, servers: [{ url: `${apiOrigin}/v1` }] }) as unknown as Document,
  },
})
