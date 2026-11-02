import { describe, expect, it } from "vitest"
import { isActive } from "../nav"

describe("isActive", () => {
  it("matches a section and the pages under it", () => {
    expect(isActive("/orders", "/orders")).toBe(true)
    expect(isActive("/orders/abc", "/orders")).toBe(true)
  })

  it("keeps Overview to the home page", () => {
    expect(isActive("/", "/")).toBe(true)
    expect(isActive("/orders", "/")).toBe(false)
  })

  it("lights one item when one nav item sits under another", () => {
    expect(isActive("/settings/api-keys", "/settings/api-keys")).toBe(true)
    expect(isActive("/settings/api-keys", "/settings")).toBe(false)
    expect(isActive("/settings", "/settings")).toBe(true)
  })

  it("doesn't match a name that only starts the same", () => {
    expect(isActive("/settings-old", "/settings")).toBe(false)
  })
})
