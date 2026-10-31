import type { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  canManageStore: vi.fn(),
  getIntegration: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/server", () => ({ connection: async () => undefined }))
vi.mock("next/navigation", () => ({ notFound: vi.fn() }))
vi.mock("@/lib/admin", () => ({ canManageStore: mocks.canManageStore }))
vi.mock("@/lib/auth", () => ({ getActiveOrganizationId: async () => "org-1" }))
vi.mock("@/lib/integrations", () => ({ getIntegration: mocks.getIntegration }))
vi.mock("@/components/layout/dashboard-page", () => ({ DashboardFormPage: vi.fn() }))
vi.mock("@/components/integrations/provider-config-form", () => ({ ProviderConfigForm: vi.fn() }))
vi.mock("@/components/skeletons", () => ({ FormPageSkeleton: vi.fn() }))
vi.mock("@prood/commerce", () => ({ paymentWebhookUrl: () => "https://checkout.test/webhook" }))

import IntegrationConfigPage from "@/app/(dashboard)/integrations/[provider]/page"

const keys = { antiPhishingKey: "secret-1", mbKey: "MB-KEY", mbWayKey: "MBW-KEY", ccKey: "CC-KEY" }

/** The page's output as text. React's own fields start with an underscore and loop. */
const serialize = (element: ReactElement) =>
  JSON.stringify(element.props, (key, value: unknown) => (key.startsWith("_") ? undefined : value))

/** Run the page's async content, which the Suspense boundary would render. */
async function content(): Promise<ReactElement> {
  const page = IntegrationConfigPage({ params: Promise.resolve({ provider: "ifthenpay" }) })
  const suspense = (page.props as { children: ReactElement }).children
  const inner = (suspense.props as { children: ReactElement<{ params: Promise<{ provider: string }> }> }).children
  return (inner.type as (props: unknown) => Promise<ReactElement>)(inner.props)
}

describe("a provider's settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getIntegration.mockResolvedValue({ provider: "ifthenpay", enabled: true, config: keys })
  })

  it("never reads a provider's keys for a member", async () => {
    mocks.canManageStore.mockResolvedValue(false)

    const body = serialize(await content())

    expect(mocks.getIntegration).not.toHaveBeenCalled()
    expect(body).not.toContain("KEY")
    expect(body).toContain("Only store owners and admins")
  })

  it("fills the form for an admin", async () => {
    mocks.canManageStore.mockResolvedValue(true)

    expect(serialize(await content())).toContain("MB-KEY")
  })
})
