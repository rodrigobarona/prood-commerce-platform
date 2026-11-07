import { describe, expect, it } from "vitest"

import { BASE_PATH, withBase } from "../base-path"

describe("withBase", () => {
  it("puts the base path in front of an absolute path", () => {
    expect(BASE_PATH).toBe("/dashboard")
    expect(withBase("/login")).toBe("/dashboard/login")
    expect(withBase("/api/export/store")).toBe("/dashboard/api/export/store")
    expect(withBase("/two-factor?redirect=%2Forders")).toBe("/dashboard/two-factor?redirect=%2Forders")
  })

  it("makes the home page the base path itself, without a trailing slash", () => {
    expect(withBase("/")).toBe("/dashboard")
    expect(withBase("/?welcome=1")).toBe("/dashboard?welcome=1")
    expect(withBase("/#top")).toBe("/dashboard#top")
  })

  it("refuses what isn't a path inside the app", () => {
    expect(() => withBase("login")).toThrow()
    expect(() => withBase("//evil.example/login")).toThrow()
    expect(() => withBase("https://prood.com/login")).toThrow()
  })
})
