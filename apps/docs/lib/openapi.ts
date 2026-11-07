import type { Document } from "fumadocs-openapi"
import { createOpenAPI } from "fumadocs-openapi/server"
import spec from "@/openapi/commerce.json"
import { site } from "./site"

export const openapi = createOpenAPI({
  input: {
    // The spec's server is relative to the API, and these pages aren't served from it.
    // Fumadocs upgrades the 3.1 document on load, so JSON's types can't describe it.
    commerce: () => ({ ...spec, servers: [{ url: `${site.apiUrl}/v1` }] }) as unknown as Document,
  },
})
