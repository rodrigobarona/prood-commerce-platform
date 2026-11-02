import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ReviewStars } from "@prood/ui/components/review-stars"

afterEach(cleanup)

const fills = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("span[style*='%']")].map((star) => star.style.width)

describe("ReviewStars", () => {
  it("draws 4.7 as four full stars and most of a fifth", () => {
    const { container } = render(<ReviewStars rating={4.7} />)
    expect(fills(container).slice(0, 4)).toEqual(["100%", "100%", "100%", "100%"])
    expect(Number.parseFloat(fills(container)[4] ?? "")).toBeCloseTo(70)
  })

  it("fills nothing past the rating", () => {
    const { container } = render(<ReviewStars rating={2} />)
    expect(fills(container)).toHaveLength(2)
  })

  it("reads out the number", () => {
    render(<ReviewStars rating={4.7} count={3} />)
    expect(screen.getByRole("img", { name: "Rated 4.7 out of 5 from 3 reviews" })).toBeTruthy()
  })
})
