import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), push: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/lib/auth/client", () => ({ signIn: { email: mocks.signIn } }))

import { LoginForm } from "../login-form"

const submit = () =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))
  })

beforeEach(() => {
  mocks.signIn.mockReset().mockResolvedValue({ error: null })
})

afterEach(cleanup)

describe("LoginForm", () => {
  it("leaves validation to the form, not the browser's bubbles", () => {
    const { container } = render(<LoginForm />)
    expect(container.querySelector("form")?.noValidate).toBe(true)
  })

  it("names what's missing beside each field, and lands on the first", async () => {
    render(<LoginForm />)
    await submit()

    const email = screen.getByLabelText("Email")
    expect(screen.getByText("Enter your whole email address, like ana@casalume.example.")).toBeTruthy()
    expect(screen.getByText("Enter your password.")).toBeTruthy()
    expect(email.getAttribute("aria-invalid")).toBe("true")
    expect(email.getAttribute("aria-describedby")).toBe("email-error")
    expect(document.activeElement).toBe(email)
    expect(mocks.signIn).not.toHaveBeenCalled()
  })

  it("signs in once the fields hold up", async () => {
    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana@example.pt" } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "x" } })
    await submit()

    expect(mocks.signIn).toHaveBeenCalledWith({ email: "ana@example.pt", password: "x" })
    expect(mocks.push).toHaveBeenCalledWith("/account")
  })
})
