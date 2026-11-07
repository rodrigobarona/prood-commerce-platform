import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { purgeExpiredAuthData } from "@prood/auth/retention"

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = Buffer.from(request.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Daily Vercel cron, see vercel.json. Refuses every call until CRON_SECRET is set. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const deleted = await purgeExpiredAuthData()
  console.info("Retention job finished", deleted)
  return NextResponse.json({ deleted })
}
