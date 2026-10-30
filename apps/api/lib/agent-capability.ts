import { CommerceError } from "@prood/types"
import { buildOpenApiDocument } from "@/lib/openapi"

/** Set by `proxy.ts` on every REST request, overwriting any client value. */
export const REQUEST_TARGET_HEADER = "x-prood-request-target"

const API_PREFIX = "/v1"

interface Route {
  method: string
  pattern: RegExp
  literals: number
  operationId: string
}

let routes: Route[] | null = null

function compileRoutes(): Route[] {
  const { paths } = buildOpenApiDocument() as unknown as {
    paths: Record<string, Record<string, { operationId?: string }>>
  }
  return Object.entries(paths)
    .flatMap(([path, item]) => {
      const segments = path.split("/").filter(Boolean)
      const source = segments.map((s) => (s.startsWith("{") ? "[^/]+" : s)).join("/")
      return Object.entries(item).flatMap(([method, operation]) =>
        operation.operationId
          ? [
              {
                method: method.toUpperCase(),
                pattern: new RegExp(`^/${source}$`),
                literals: segments.filter((s) => !s.startsWith("{")).length,
                operationId: operation.operationId,
              },
            ]
          : []
      )
    })
    .sort((a, b) => b.literals - a.literals)
}

/** The API operation a `METHOD /v1/path` target maps to, or null if none does. */
export function operationForRequest(target: string | null): string | null {
  const [method, fullPath] = target?.split(" ") ?? []
  if (!method || !fullPath?.startsWith(`${API_PREFIX}/`)) return null
  const path = fullPath.slice(API_PREFIX.length)
  routes ??= compileRoutes()
  return routes.find((r) => r.method === method && r.pattern.test(path))?.operationId ?? null
}

/** Capabilities are per operation: one admin grant doesn't unlock the others. */
export function assertCapability(capabilities: string[], operation: string | null) {
  if (!operation || !capabilities.includes(operation)) {
    throw new CommerceError(
      `This agent doesn't have the ${operation ?? "required"} capability.`,
      "FORBIDDEN"
    )
  }
}
