import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }))

vi.mock("@/lib/auth/client", () => ({ authClient: { requestPasswordReset: mocks.requestPasswordReset } }))

import { ForgotPasswordForm } from "../forgot-password-form"

const submit = () =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))
  })

beforeEach(() => {
  mocks.requestPasswordReset.mockReset().mockResolvedValue({ error: null })
})

afterEach(cleanup)

describe("ForgotPasswordForm", () => {
  it("leaves validation to the form, not the browser's bubbles", () => {
    const { container } = render(<ForgotPasswordForm />)
    expect(container.querySelector("form")?.noValidate).toBe(true)
  })

  it("says what's wrong beside the field and lands on it", async () => {
    render(<ForgotPasswordForm />)
    await submit()

    const email = screen.getByLabelText("Email")
    expect(screen.getByText("Enter your whole email address, like ana@casalume.example.")).toBeTruthy()
    expect(email.getAttribute("aria-invalid")).toBe("true")
    expect(email.getAttribute("aria-describedby")).toBe("email-error")
    expect(document.activeElement).toBe(email)
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled()
  })

  it("sends the link once the address holds up", async () => {
    render(<ForgotPasswordForm />)
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana@example.pt" } })
    await submit()

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({ email: "ana@example.pt", redirectTo: "/reset-password" })
    expect(screen.getByText(/we've sent a password reset link/)).toBeTruthy()
  })
})
