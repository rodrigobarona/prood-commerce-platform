import { toNextJsHandler } from "better-auth/next-js"
import { applyAuthCors, authPreflightResponse } from "@/lib/auth/cors"
import { getAuth } from "@/lib/auth/server"

const authHandler = toNextJsHandler({
  handler: (request) => getAuth().handler(request),
})

async function withCors(
  handler: (request: Request) => Promise<Response>,
  request: Request
) {
  return applyAuthCors(request, await handler(request))
}

export const GET = (request: Request) => withCors(authHandler.GET, request)
export const POST = (request: Request) => withCors(authHandler.POST, request)
export const PATCH = (request: Request) => withCors(authHandler.PATCH, request)
export const PUT = (request: Request) => withCors(authHandler.PUT, request)
export const DELETE = (request: Request) => withCors(authHandler.DELETE, request)
export const OPTIONS = (request: Request) => authPreflightResponse(request)
