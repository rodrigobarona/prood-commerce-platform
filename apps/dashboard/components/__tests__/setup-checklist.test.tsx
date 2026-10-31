import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { setupChecklist } from "@/lib/setup-checklist"
import { SetupChecklist } from "../overview/setup-checklist"

const STORE_URL = "https://lojadaana.pt"
const fresh = { totalProducts: 0, activeProducts: 0, totalOrders: 0, canTakeOrders: false }

describe("SetupChecklist", () => {
  it("shows what's left, each with a link to do it", () => {
    const html = renderToStaticMarkup(<SetupChecklist items={setupChecklist(fresh, STORE_URL)} />)
    expect(html).toContain("0 of 3 done")
    expect(html).toContain('href="/products/new"')
    expect(html).toContain('href="/integrations"')
    expect(html).toContain(`href="${STORE_URL}"`)
  })

  it("drops the link for a finished step", () => {
    const items = setupChecklist({ ...fresh, canTakeOrders: true }, STORE_URL)
    const html = renderToStaticMarkup(<SetupChecklist items={items} />)
    expect(html).toContain("1 of 3 done")
    expect(html).not.toContain('href="/integrations"')
  })

  it("disappears once the store is ready", () => {
    const items = setupChecklist(
      { totalProducts: 1, activeProducts: 1, totalOrders: 1, canTakeOrders: true },
      STORE_URL,
    )
    expect(renderToStaticMarkup(<SetupChecklist items={items} />)).toBe("")
  })
})
