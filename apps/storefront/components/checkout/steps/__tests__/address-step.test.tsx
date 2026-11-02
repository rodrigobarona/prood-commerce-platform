import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// The step reads its key when it's imported.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY = "key"
})

vi.mock("../../address-autocomplete", () => ({ AddressAutocomplete: () => <input aria-label="Search address" /> }))

import { AddressStep } from "../address-step"

const open = (demo: boolean) =>
  render(<AddressStep demo={demo} onSubmit={vi.fn()} onBack={vi.fn()} continueLabel="Continue to shipping" />)

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("the address lookup", () => {
  it("helps on a real store", () => {
    open(false)
    expect(screen.getByLabelText("Search address")).toBeTruthy()
  })

  it("stays off on the demo, whose privacy notice says nothing leaves the tab", () => {
    open(true)
    expect(screen.queryByLabelText("Search address")).toBeNull()
  })
})
