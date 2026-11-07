import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/lib/auth/client", () => ({ authClient: { twoFactor: {} } }))

import { TwoFactorForm, type TwoFactorClient } from "@prood/ui/components/two-factor-form"
import { TwoFactorPanel } from "../account/two-factor-panel"

const client: TwoFactorClient = {
  verifyTotp: vi.fn(),
  verifyBackupCode: vi.fn(),
}

describe("TwoFactorPanel on the Profile page", () => {
  it("offers to turn it on, and nothing that needs it on, when it is off", () => {
    const html = renderToStaticMarkup(<TwoFactorPanel enabled={false} />)
    expect(html).toContain("Two-factor authentication")
    expect(html).toContain("Off")
    expect(html).toContain("Turn on")
    expect(html).toContain("optional")
    expect(html).not.toContain("Make new backup codes")
    expect(html).not.toContain("Turn off")
  })

  it("offers new backup codes and turning it off when it is on", () => {
    const html = renderToStaticMarkup(<TwoFactorPanel enabled />)
    expect(html).toContain("On")
    expect(html).toContain("Make new backup codes")
    expect(html).toContain("Turn off")
    expect(html).not.toContain(">Turn on<")
  })
})

describe("TwoFactorForm", () => {
  const form = () => renderToStaticMarkup(<TwoFactorForm client={client} redirect={null} />)

  it("asks for the 6-digit code first, with a way to use a backup code", () => {
    const html = form()
    expect(html).toContain("6-digit code")
    expect(html).toContain('autoComplete="one-time-code"')
    expect(html).toContain("Use a backup code")
    expect(html).toContain("Back to sign in")
  })

  it("never offers to trust the device", () => {
    expect(form()).not.toMatch(/trust this device/i)
    expect(form()).not.toContain('type="checkbox"')
    expect(form()).not.toContain('role="checkbox"')
  })
})
