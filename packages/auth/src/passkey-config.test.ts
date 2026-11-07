import { describe, expect, it } from "vitest"
import { isPasskeyEnabled, resolvePasskeyConfig } from "./passkey-config"

describe("resolvePasskeyConfig", () => {
  it("is off when both variables are unset or blank", () => {
    expect(resolvePasskeyConfig({})).toBeNull()
    expect(resolvePasskeyConfig({ PASSKEY_RP_ID: " ", PASSKEY_ORIGINS: "" })).toBeNull()
  })

  it("returns the ID and the exact origins", () => {
    expect(
      resolvePasskeyConfig({
        PASSKEY_RP_ID: "prood.com",
        PASSKEY_ORIGINS: "https://dashboard.prood.com, https://admin.prood.com/",
      }),
    ).toEqual({ rpID: "prood.com", origin: ["https://dashboard.prood.com", "https://admin.prood.com"] })
  })

  it("accepts localhost with ports, and drops duplicates", () => {
    expect(
      resolvePasskeyConfig({
        PASSKEY_RP_ID: "localhost",
        PASSKEY_ORIGINS: "http://localhost:4002,http://localhost:4006,http://localhost:4002",
      }),
    ).toEqual({ rpID: "localhost", origin: ["http://localhost:4002", "http://localhost:4006"] })
  })

  it("accepts the ID itself as an origin", () => {
    expect(resolvePasskeyConfig({ PASSKEY_RP_ID: "prood.com", PASSKEY_ORIGINS: "https://prood.com" })?.origin).toEqual([
      "https://prood.com",
    ])
  })

  it("throws when only one variable is set", () => {
    expect(() => resolvePasskeyConfig({ PASSKEY_RP_ID: "prood.com" })).toThrow(/PASSKEY_ORIGINS is not/)
    expect(() => resolvePasskeyConfig({ PASSKEY_ORIGINS: "https://dashboard.prood.com" })).toThrow(/PASSKEY_RP_ID is not/)
  })

  it("throws when an origin is not under the ID", () => {
    expect(() =>
      resolvePasskeyConfig({ PASSKEY_RP_ID: "prood.com", PASSKEY_ORIGINS: "https://dashboard-prood.vercel.app" }),
    ).toThrow(/not under PASSKEY_RP_ID prood.com/)
    expect(() =>
      resolvePasskeyConfig({ PASSKEY_RP_ID: "prood.com", PASSKEY_ORIGINS: "https://evilprood.com" }),
    ).toThrow(/not under/)
  })

  it("throws when an origin has a path or is not a URL", () => {
    expect(() =>
      resolvePasskeyConfig({ PASSKEY_RP_ID: "prood.com", PASSKEY_ORIGINS: "https://dashboard.prood.com/login" }),
    ).toThrow(/not an origin/)
    expect(() => resolvePasskeyConfig({ PASSKEY_RP_ID: "prood.com", PASSKEY_ORIGINS: "dashboard.prood.com" })).toThrow(
      /not an origin/,
    )
  })

  it("throws when the ID is not a bare domain", () => {
    expect(() =>
      resolvePasskeyConfig({ PASSKEY_RP_ID: "https://prood.com", PASSKEY_ORIGINS: "https://prood.com" }),
    ).toThrow(/bare domain/)
    expect(() =>
      resolvePasskeyConfig({ PASSKEY_RP_ID: "localhost:4002", PASSKEY_ORIGINS: "http://localhost:4002" }),
    ).toThrow(/bare domain/)
  })
})

describe("isPasskeyEnabled", () => {
  it("is true only when both variables are set", () => {
    expect(isPasskeyEnabled({})).toBe(false)
    expect(isPasskeyEnabled({ PASSKEY_RP_ID: "localhost", PASSKEY_ORIGINS: "http://localhost:4002" })).toBe(true)
    expect(() => isPasskeyEnabled({ PASSKEY_RP_ID: "localhost" })).toThrow()
  })
})
