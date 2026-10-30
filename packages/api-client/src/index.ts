import type { CommerceErrorBody } from "@prood/types"
import createClient, { type Client, type Middleware } from "openapi-fetch"
import type { paths } from "./schema.js"

export type { paths }
export type CommerceApiClient = Client<paths>

interface ApiResponse {
  data?: unknown
  error?: unknown
  response: Response
}

type SuccessBody<TResponse extends ApiResponse> = Exclude<TResponse["data"], undefined>

/** The success body of a response; `void` for 204 No Content operations. */
export type ResponseBody<TResponse extends ApiResponse> = [SuccessBody<TResponse>] extends [never]
  ? void
  : SuccessBody<TResponse>

/**
 * Unwrap an `openapi-fetch` response, throwing on error or on an unexpectedly
 * empty body. A 204 has no body, so it resolves to nothing.
 */
export async function unwrap<TResponse extends ApiResponse>(
  promise: Promise<TResponse>
): Promise<ResponseBody<TResponse>> {
  const { data, error, response } = await promise
  if (error) throw error
  if (data === undefined && response.status !== 204) throw new Error("Empty API response")
  return data as ResponseBody<TResponse>
}

export function isCommerceApiError(error: unknown): error is CommerceErrorBody {
  if (typeof error !== "object" || error === null) return false
  const candidate = error as Record<string, unknown>
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    (candidate.errors === undefined ||
      (Array.isArray(candidate.errors) &&
        candidate.errors.every((item) => {
          if (typeof item !== "object" || item === null) return false
          const serializedError = item as Record<string, unknown>
          return (
            typeof serializedError.path === "string" &&
            typeof serializedError.message === "string"
          )
        })))
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
