import { describe, expect, it } from "vitest"
import { isExistingAccount, signInErrorMessage, signUpErrorMessage } from "../auth/messages"

describe("signInErrorMessage", () => {
  it("doesn't say which of the two was wrong", () => {
    expect(signInErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })).toBe(
      "We couldn't sign you in. That email and password don't match. Try again or reset your password."
    )
  })

  it("tells a rate limit from a wrong password", () => {
    expect(signInErrorMessage({ status: 429 })).toMatch(/too many attempts/)
  })
})

describe("signUpErrorMessage", () => {
  it("spots an email that already has an account", () => {
    const error = { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", status: 422 }
    expect(isExistingAccount(error)).toBe(true)
    expect(signUpErrorMessage(error)).toBe("We couldn't create your account. That email already has one.")
  })

  it("doesn't treat other failures as an existing account", () => {
    expect(isExistingAccount({ status: 500 })).toBe(false)
  })
})
