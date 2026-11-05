import { timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requiredEnv, STOREFRONT_CACHE_TAGS, storeCacheTag } from "@prood/types"

const body = z.object({
  tenantId: z.string().min(1),
  tags: z.array(z.enum(STOREFRONT_CACHE_TAGS)).min(1),
})

function authorized(request: Request): boolean {
  const expected = Buffer.from(`Bearer ${requiredEnv(process.env.STOREFRONT_REVALIDATE_SECRET, "STOREFRONT_REVALIDATE_SECRET")}`)
  const given = Buffer.from(request.headers.get("authorization") ?? "")
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * The API and dashboard call this when a store's catalog or details change, so
 * its cached pages are rebuilt on their next visit instead of waiting out
 * their time limit.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: "Expected a tenantId and tags" }, { status: 400 })

  const { tenantId, tags } = parsed.data
  for (const tag of tags) revalidateTag(storeCacheTag(tag, tenantId), { expire: 0 })
  return NextResponse.json({ revalidated: tags })
}
