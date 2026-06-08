import createClient, { type Client, type Middleware } from "openapi-fetch"
import type { paths } from "./schema"

export type { paths }
export type CommerceApiClient = Client<paths>

export interface CommerceErrorBody {
  code: string
  message: string
  errors?: { path: string; message: string }[]
}

/** Unwrap an `openapi-fetch` response, throwing on error or empty data. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: CommerceErrorBody | unknown } | unknown>
): Promise<T> {
  const { data, error } = (await promise) as {
    data?: T
    error?: CommerceErrorBody | unknown
  }
  if (error) throw error
  if (data === undefined) throw new Error("Empty API response")
  return data
}

export function isCommerceApiError(error: unknown): error is CommerceErrorBody {
  if (typeof error !== "object" || error === null) return false
  const candidate = error as Record<string, unknown>
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    (candidate.errors === undefined || Array.isArray(candidate.errors))
  )
}

export interface CreateCommerceApiClientOptions {
  /** Base URL including `/v1`, e.g. `https://api.example.com/v1` */
  baseUrl: string
  apiKey?: string
  /** Agent Auth Bearer JWT. */
  bearerToken?: string
  /** Raw `Cookie` header value (Better Auth session for dashboard SSR). */
  cookie?: string
  /** Request `Host` for storefront tenant resolution. */
  host?: string
  fetch?: typeof fetch
}

export function createCommerceApiClient(
  options: CreateCommerceApiClientOptions
): CommerceApiClient {
  const middleware: Middleware = {
    onRequest({ request }) {
      if (options.apiKey) {
        request.headers.set("x-api-key", options.apiKey)
      }
      if (options.bearerToken) {
        request.headers.set("authorization", `Bearer ${options.bearerToken}`)
      }
      if (options.cookie) {
        request.headers.set("cookie", options.cookie)
      }
      if (options.host) {
        // x-storefront-host is the reliable channel — HTTP clients and CDNs
        // may overwrite the Host header with the actual destination hostname.
        request.headers.set("x-storefront-host", options.host)
        request.headers.set("host", options.host)
      }
      return request
    },
  }

  const client = createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/$/, ""),
    fetch: options.fetch,
  })
  client.use(middleware)
  return client
}
