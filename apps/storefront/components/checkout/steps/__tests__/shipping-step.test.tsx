import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ShippingStep } from "../shipping-step"

const standard = { id: "standard", name: "Standard", price: { amount: 3, currency: "EUR", formatted: "€3.00" } }
const express = { id: "express", name: "Express", price: { amount: 8, currency: "EUR", formatted: "€8.00" } }

async function open(onSelect: (methodId: string) => Promise<void>, methods = [standard, express]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ methods }))),
  )
  const onSubmit = vi.fn()
  render(<ShippingStep cartId="cart-1" onSelect={onSelect} onSubmit={onSubmit} onBack={vi.fn()} />)
  await act(async () => {})
  return onSubmit
}

const continueButton = () => screen.getByRole("button", { name: "Continue to review" }) as HTMLButtonElement
const retryButton = () => screen.getByRole("button", { name: "Try again" })

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element)
  })
}

beforeEach(() => {
  // Radix measures the radio's size.
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

describe("after a failed save", () => {
  it("retries the selected method, then lets the shopper continue", async () => {
    const onSelect = vi.fn().mockRejectedValueOnce(new Error("save failed")).mockResolvedValue(undefined)
    await open(onSelect)

    await click(screen.getByRole("radio", { name: /Express/ }))
    expect(screen.getByRole("alert").textContent).toContain("couldn't add this shipping method")
    expect(continueButton().disabled).toBe(true)

    await click(retryButton())

    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenLastCalledWith("express")
    expect(screen.queryByRole("alert")).toBeNull()
    expect(continueButton().disabled).toBe(false)
  })

  it("keeps offering the retry while saves keep failing", async () => {
    const onSelect = vi.fn().mockRejectedValue(new Error("save failed"))
    await open(onSelect)

    await click(screen.getByRole("radio", { name: /Express/ }))
    await click(retryButton())

    expect(retryButton()).toBeTruthy()
    expect(continueButton().disabled).toBe(true)
  })

  it("recovers when the shopper chooses something else instead", async () => {
    const onSelect = vi.fn().mockRejectedValueOnce(new Error("save failed")).mockResolvedValue(undefined)
    await open(onSelect)

    await click(screen.getByRole("radio", { name: /Express/ }))
    await click(screen.getByRole("radio", { name: /Standard/ }))

    expect(screen.queryByRole("alert")).toBeNull()
    expect(continueButton().disabled).toBe(false)
  })

  it("retries a method chosen automatically for the shopper", async () => {
    const onSelect = vi.fn().mockRejectedValueOnce(new Error("save failed")).mockResolvedValue(undefined)
    await open(onSelect, [standard])

    await click(retryButton())

    expect(onSelect).toHaveBeenLastCalledWith("standard")
    expect(continueButton().disabled).toBe(false)
  })
})
