import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { DASHBOARD_SEGMENTS, SESSION_COOKIES } from "../zones"

const appDir = join(import.meta.dirname, "..", "..", "app")

/** The first path segment of every page, route and file this app serves itself. */
function ownSegments(): string[] {
  return readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("(") && !entry.name.startsWith("_") && !entry.name.startsWith("["))
    .map((entry) => entry.name.replace(/\.[a-z]+$/, ""))
}

describe("the dashboard's place on prood.com", () => {
  it("shares no first path segment with a page or route of this app", () => {
    const own = new Set(ownSegments())
    expect(DASHBOARD_SEGMENTS.filter((segment) => own.has(segment))).toEqual([])
  })

  it("lists each segment once", () => {
    expect(new Set(DASHBOARD_SEGMENTS).size).toBe(DASHBOARD_SEGMENTS.length)
  })

  it("names the cookie Better Auth sends on http and on https", () => {
    expect(SESSION_COOKIES).toEqual(["better-auth.session_token", "__Secure-better-auth.session_token"])
  })
})
