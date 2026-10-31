import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { setupChecklist } from "@/lib/setup-checklist"
import { SetupChecklist } from "../overview/setup-checklist"

const STORE_URL = "https://lojadaana.pt"
const fresh = {
  totalProducts: 0,
  activeProducts: 0,
  paidOrders: 0,
  canTakeOrders: false,
  hasContactEmail: false,
}

describe("SetupChecklist", () => {
  it("shows what's left, each with a link to do it", () => {
    const html = renderToStaticMarkup(<SetupChecklist items={setupChecklist(fresh, STORE_URL)} />)
    expect(html).toContain("0 of 4 done")
    expect(html).toContain('href="/products/new"')
    expect(html).toContain('href="/integrations"')
    expect(html).toContain('href="/settings"')
  })

  it("holds back the store link until there's something to buy and a way to pay", () => {
    const blocked = setupChecklist(fresh, STORE_URL)
    expect(renderToStaticMarkup(<SetupChecklist items={blocked} />)).not.toContain(`href="${STORE_URL}"`)

    const ready = setupChecklist({ ...fresh, activeProducts: 1, canTakeOrders: true }, STORE_URL)
    expect(renderToStaticMarkup(<SetupChecklist items={ready} />)).toContain(`href="${STORE_URL}"`)
  })

  it("drops the link for a finished step", () => {
    const items = setupChecklist({ ...fresh, canTakeOrders: true }, STORE_URL)
    const html = renderToStaticMarkup(<SetupChecklist items={items} />)
    expect(html).toContain("1 of 4 done")
    expect(html).not.toContain('href="/integrations"')
  })

  it("disappears once the store is ready", () => {
    const items = setupChecklist(
      { ...fresh, activeProducts: 1, paidOrders: 1, canTakeOrders: true, hasContactEmail: true },
      STORE_URL,
    )
    expect(renderToStaticMarkup(<SetupChecklist items={items} />)).toBe("")
  })
})
