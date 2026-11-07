import { createConsentRoute } from "c15t/next/api"
import { withoutLocationHeaders } from "@prood/consent/route"

/** Same-origin consent endpoint: policy for the banner, and saved choices forwarded to INTH. See c15t.config.ts. */
const route = createConsentRoute({ proxy: true })

type Handler = (request: Request, context: { params: Promise<{ c15t?: string[] }> }) => Promise<Response>

const wrap =
  (handler: Handler): Handler =>
  (request, context) =>
    handler(withoutLocationHeaders(request), context)

export const GET = wrap(route.GET as Handler)
export const POST = wrap(route.POST as Handler)
export const PUT = wrap(route.PUT as Handler)
export const PATCH = wrap(route.PATCH as Handler)
export const DELETE = wrap(route.DELETE as Handler)
export const OPTIONS = wrap(route.OPTIONS as Handler)
