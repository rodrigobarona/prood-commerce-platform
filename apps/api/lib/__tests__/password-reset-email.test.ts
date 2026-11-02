import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  afterCallbacks: [] as (() => Promise<void>)[],
}))

vi.mock("next/server", () => ({ after: (callback: () => Promise<void>) => mocks.afterCallbacks.push(callback) }))
vi.mock("../mailer", () => ({ getMailer: () => ({ send: mocks.send }) }))

import { sendPasswordResetEmail } from "../auth/password-reset-email"

const input = {
  user: { id: "user-1", email: "someone@example.com" },
  url: "https://api.test/api/auth/reset-password/token?callbackURL=https%3A%2F%2Fdashboard.test%2Freset-password",
}

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.afterCallbacks.length = 0
  })

  it("sends nothing until the response is on its way", () => {
    sendPasswordResetEmail(input)
    expect(mocks.send).not.toHaveBeenCalled()
    expect(mocks.afterCallbacks).toHaveLength(1)
  })

  it("mails the link through the password reset template", async () => {
    sendPasswordResetEmail(input)
    await mocks.afterCallbacks[0]?.()
    expect(mocks.send).toHaveBeenCalledWith("email", {
      to: "someone@example.com",
      subject: "Reset your password",
      template: "password-reset",
      data: { companyName: "Prood", url: input.url },
    })
  })

  it("survives the mailer failing, so a missing address and a broken one look the same", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mocks.send.mockRejectedValue(new Error("Resend is down"))
    sendPasswordResetEmail(input)
    await expect(mocks.afterCallbacks[0]?.()).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
  })
})
