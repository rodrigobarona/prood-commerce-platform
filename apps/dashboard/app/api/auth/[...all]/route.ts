import { type NextRequest } from "next/server"
import { cookies } from "next/headers"
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies"
import { proxyAuthRequest } from "@/lib/auth/proxy"

/**
 * Forward Set-Cookie headers from the proxy response into Next.js's cookie
 * jar as a safety net. Even if the Response header path loses Set-Cookie
 * during the Next.js pipeline, cookies().set() guarantees delivery.
 */
async function forwardCookies(response: Response): Promise<void> {
  const setCookieHeaders = response.headers.getSetCookie()
  if (setCookieHeaders.length === 0) return

  const cookieStore = await cookies()
  for (const raw of setCookieHeaders) {
    const parsed = parseSetCookieHeader(raw)
    parsed.forEach((attrs, name) => {
      if (!name) return
      try {
        cookieStore.set(name, attrs.value, toCookieOptions(attrs))
      } catch {
        // cookies().set() may throw in read-only contexts
      }
    })
  }
}

async function handleAuth(request: NextRequest) {
  const response = await proxyAuthRequest(request)
  await forwardCookies(response)
  return response
}

export async function GET(request: NextRequest) {
  return handleAuth(request)
}

export async function POST(request: NextRequest) {
  return handleAuth(request)
}

export async function PATCH(request: NextRequest) {
  return handleAuth(request)
}

export async function PUT(request: NextRequest) {
  return handleAuth(request)
}

export async function DELETE(request: NextRequest) {
  return handleAuth(request)
}

export async function OPTIONS(request: NextRequest) {
  return handleAuth(request)
}
