import { APIError } from "better-auth/api"
import { describe, expect, it } from "vitest"

import { guardTrustDevice } from "../auth/two-factor-guard"

describe("guardTrustDevice", () => {
  it.each(["/two-factor/verify-totp", "/two-factor/verify-backup-code", "/two-factor/verify-otp"])(
    "refuses trustDevice: true on %s, with a 400",
    (path) => {
      let thrown: unknown
      try {
        guardTrustDevice({ path, body: { code: "123456", trustDevice: true } })
      } catch (error) {
        thrown = error
      }
      expect(thrown).toBeInstanceOf(APIError)
      expect(thrown).toMatchObject({ status: "BAD_REQUEST", body: { message: expect.stringContaining("trust devices") } })
    },
  )

  it("refuses any value that isn't false, so a string can't slip through", () => {
    expect(() => guardTrustDevice({ path: "/two-factor/verify-totp", body: { trustDevice: "true" } })).toThrow()
    expect(() => guardTrustDevice({ path: "/two-factor/verify-totp", body: { trustDevice: 1 } })).toThrow()
  })

  it("lets a verification without it, or with false, through", () => {
    expect(() => guardTrustDevice({ path: "/two-factor/verify-totp", body: { code: "123456" } })).not.toThrow()
    expect(() => guardTrustDevice({ path: "/two-factor/verify-totp", body: { trustDevice: false } })).not.toThrow()
    expect(() => guardTrustDevice({ path: "/two-factor/verify-totp" })).not.toThrow()
  })

  it("leaves other routes alone", () => {
    expect(() => guardTrustDevice({ path: "/sign-in/email", body: { trustDevice: true } })).not.toThrow()
  })
})
