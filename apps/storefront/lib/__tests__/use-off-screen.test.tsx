import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useOffScreen } from "../use-off-screen"

let report: (entry: { isIntersecting: boolean; bottom: number }) => void
let options: IntersectionObserverInit | undefined

function Probe({ side }: { side: "passed" | "either" }) {
  const [ref, offScreen] = useOffScreen<HTMLDivElement>(side)
  return <div ref={ref}>{offScreen ? "off screen" : "on screen"}</div>
}

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
        options = init
        report = ({ isIntersecting, bottom }) =>
          act(() =>
            callback(
              [{ isIntersecting, boundingClientRect: { bottom } } as IntersectionObserverEntry],
              {} as IntersectionObserver,
            ),
          )
      }
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("useOffScreen", () => {
  it("doesn't count what hasn't been reached as passed", () => {
    render(<Probe side="passed" />)
    report({ isIntersecting: false, bottom: 980 })
    expect(screen.getByText("on screen")).toBeTruthy()
    report({ isIntersecting: false, bottom: -40 })
    expect(screen.getByText("off screen")).toBeTruthy()
  })

  it("watches only the top edge for passed, so a fast scroll can't jump over the change", () => {
    render(<Probe side="passed" />)
    expect(options?.rootMargin).toMatch(/^0px 0px \d+px 0px$/)
  })

  it("counts both sides when asked to", () => {
    render(<Probe side="either" />)
    expect(options).toBeUndefined()
    report({ isIntersecting: false, bottom: 980 })
    expect(screen.getByText("off screen")).toBeTruthy()
    report({ isIntersecting: true, bottom: 500 })
    expect(screen.getByText("on screen")).toBeTruthy()
    report({ isIntersecting: false, bottom: -40 })
    expect(screen.getByText("off screen")).toBeTruthy()
  })
})
