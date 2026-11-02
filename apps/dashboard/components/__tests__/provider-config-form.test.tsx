import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock("@/app/(dashboard)/integrations/actions", () => ({
  disconnectIntegrationAction: vi.fn(),
  saveIntegrationAction: vi.fn(),
}))

import { getProvider } from "@/lib/providers"
import { ProviderConfigForm } from "../integrations/provider-config-form"

const stripe = getProvider("stripe")
if (!stripe) throw new Error("no stripe provider")

const form = (props: { connected: boolean; configuredKeys: string[] }) =>
  renderToStaticMarkup(
    <ProviderConfigForm
      provider={stripe}
      initialValues={{ publishableKey: "pk_live_visible" }}
      initialEnabled
      webhookUrl="https://checkout.test/webhook"
      {...props}
    />
  )

describe("ProviderConfigForm", () => {
  it("shows a saved secret as dots with a way to replace it", () => {
    const html = form({ connected: true, configuredKeys: ["publishableKey", "secretKey", "webhookSecret"] })
    expect(html).toContain("Replace secret key")
    expect(html).toContain("Replace signing secret")
    expect(html).toContain("••••")
    expect(html).not.toContain('id="secretKey"')
  })

  it("asks for keys when nothing is saved", () => {
    const html = form({ connected: false, configuredKeys: [] })
    expect(html).toContain('id="secretKey"')
    expect(html).not.toContain("Replace secret key")
    expect(html).toContain("Connect Stripe")
  })

  it("walks a new merchant through three numbered steps", () => {
    const html = form({ connected: false, configuredKeys: [] })
    for (const step of stripe.guide.steps) expect(html).toContain(step.title)
    expect(html).toContain("What you&#x27;ll need")
    expect(html).toContain("Test it first")
  })

  it("keeps Disconnect out of the form, in a section of its own", () => {
    const html = form({ connected: true, configuredKeys: ["secretKey"] })
    expect(html.indexOf("</form>")).toBeLessThan(html.lastIndexOf("Disconnect Stripe"))
    expect(html.slice(0, html.indexOf("</form>"))).not.toContain("Disconnect Stripe")
  })
})
