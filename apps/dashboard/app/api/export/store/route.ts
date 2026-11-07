import { headers } from "next/headers"
import { getCommerceApiOrigin } from "@/lib/commerce-api"

/** Passes the signed-in merchant's download through from the API, which checks who is asking. */
export async function GET() {
  const upstream = await fetch(`${getCommerceApiOrigin()}/api/store/export`, {
    headers: { cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
  })
  if (!upstream.ok) {
    return Response.json({ error: "Sign in again to download your data." }, { status: upstream.status === 403 ? 403 : 401 })
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? "attachment",
      "Cache-Control": "no-store",
    },
  })
}
