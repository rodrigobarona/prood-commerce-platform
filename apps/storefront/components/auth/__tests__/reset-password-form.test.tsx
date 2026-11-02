import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ resetPassword: vi.fn() }))

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("token=t1") }))
vi.mock("@/lib/auth/client", () => ({ authClient: { resetPassword: mocks.resetPassword } }))

import { ResetPasswordForm } from "../reset-password-form"

const submit = () =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }))
  })

const fill = (password: string, confirm: string) => {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } })
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: confirm } })
}

beforeEach(() => {
  mocks.resetPassword.mockReset().mockResolvedValue({ error: null })
})

afterEach(cleanup)

describe("ResetPasswordForm", () => {
  it("leaves validation to the form, not the browser's bubbles", () => {
    const { container } = render(<ResetPasswordForm />)
    expect(container.querySelector("form")?.noValidate).toBe(true)
  })

  it("says what's wrong beside the field and lands on it", async () => {
    render(<ResetPasswordForm />)
    await submit()

    const password = screen.getByLabelText("New password")
    expect(screen.getByText("Choose a password of at least 8 characters.")).toBeTruthy()
    expect(password.getAttribute("aria-invalid")).toBe("true")
    expect(password.getAttribute("aria-describedby")).toBe("password-error")
    expect(document.activeElement).toBe(password)
    expect(mocks.resetPassword).not.toHaveBeenCalled()
  })

  it("puts a mismatch on the second field", async () => {
    render(<ResetPasswordForm />)
    fill("long enough", "long enuogh")
    await submit()

    const confirm = screen.getByLabelText("Confirm password")
    expect(screen.getByText("Enter the same password in both fields.")).toBeTruthy()
    expect(confirm.getAttribute("aria-describedby")).toBe("confirmPassword-error")
    expect(document.activeElement).toBe(confirm)
    expect(mocks.resetPassword).not.toHaveBeenCalled()
  })

  it("resets the password once both fields hold up", async () => {
    render(<ResetPasswordForm />)
    fill("long enough", "long enough")
    await submit()

    expect(mocks.resetPassword).toHaveBeenCalledWith({ newPassword: "long enough", token: "t1" })
    expect(screen.getByText(/Your password has been reset/)).toBeTruthy()
  })
})
