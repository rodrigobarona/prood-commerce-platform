import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config"
import { BASE_PATH, withBasePath } from "../base-path"

describe("withBasePath", () => {
  it("puts app paths under /pay", () => {
    expect(withBasePath("/api/sessions/s1/confirm")).toBe("/pay/api/sessions/s1/confirm")
    expect(withBasePath("/confirm/s1")).toBe("/pay/confirm/s1")
    expect(withBasePath("/c/s1")).toBe("/pay/c/s1")
  })

  it("is the base path Next serves the app under", () => {
    expect(nextConfig.basePath).toBe(BASE_PATH)
  })
})
