import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@prood/platform", () => ({ DEMO_ORG_ID: "org_demo" }))

import { DEMO_MESSAGE, DemoNotice } from "../demo-notice"

afterEach(cleanup)

describe("DemoNotice", () => {
  it("says so on the demo store", () => {
    render(<DemoNotice tenantId="org_demo" />)
    expect(screen.getByText(DEMO_MESSAGE)).toBeTruthy()
  })

  it("stays off a real store, whatever it's called", () => {
    const { container } = render(<DemoNotice tenantId="org_casa_exemplo" />)
    expect(container.textContent).toBe("")
  })
})
