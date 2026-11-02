import { describe, expect, it } from "vitest"
import { registerErrors, resetPasswordErrors, signInErrors } from "../auth/form-errors"

describe("sign-in errors", () => {
  it("names each thing to fix", () => {
    expect(signInErrors({ email: "ana@", password: "" })).toEqual({
      email: "Enter your whole email address, like ana@casalume.example.",
      password: "Enter your password.",
    })
  })

  it("takes a short password: only the server can say it's wrong", () => {
    expect(signInErrors({ email: "ana@example.pt", password: "x" })).toEqual({})
  })
})

describe("register errors", () => {
  it("asks for a name and a long enough password", () => {
    expect(registerErrors({ name: " ", email: "ana@example.pt", password: "short" })).toEqual({
      name: "Enter your name.",
      password: "Choose a password of at least 8 characters.",
    })
  })
})

describe("reset password errors", () => {
  it("asks for a long enough password", () => {
    expect(resetPasswordErrors("short", "short")).toEqual({
      password: "Choose a password of at least 8 characters.",
    })
  })

  it("puts a mismatch on the second field", () => {
    expect(resetPasswordErrors("long enough", "other")).toEqual({
      confirmPassword: "Enter the same password in both fields.",
    })
  })

  it("passes two matching, long enough passwords", () => {
    expect(resetPasswordErrors("long enough", "long enough")).toEqual({})
  })
})
