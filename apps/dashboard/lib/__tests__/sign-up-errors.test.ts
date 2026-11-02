import { describe, expect, it } from "vitest"
import { signUpErrors } from "../auth/sign-up-errors"

const valid = { name: "Ana", storeName: "Grés", email: "ana@gres.pt", password: "long-enough" }

describe("signUpErrors", () => {
  it("has nothing to say about a good form", () => {
    expect(signUpErrors(valid, { needsStore: true })).toEqual({})
  })

  it("names every field that's wrong", () => {
    const errors = signUpErrors({ name: " ", storeName: "", email: "a@b", password: "short" }, { needsStore: true })
    expect(Object.keys(errors)).toEqual(["name", "storeName", "email", "password"])
  })

  it("doesn't ask an invited teammate for a store", () => {
    expect(signUpErrors({ ...valid, storeName: "" }, { needsStore: false })).toEqual({})
  })
})
