import { describe, expect, it } from "vitest"
import { countryName, formatDate, formatDateTime, formatRelative, greeting, humanize } from "../format"

const NOW = "2026-10-29T10:00:00Z"

describe("dates", () => {
  it("writes dates the way the brand does", () => {
    expect(formatDate("2026-10-29T10:00:00Z", "Europe/Lisbon")).toBe("29 Oct 2026")
  })

  it("uses a 24-hour clock in the store's timezone", () => {
    expect(formatDateTime("2026-10-29T15:05:00Z", "Asia/Tokyo")).toBe("30 Oct 2026, 00:05")
  })

  it("survives a timezone a merchant typed wrong", () => {
    expect(formatDate("2026-10-29T10:00:00Z", "Mars/Olympus")).toContain("Oct 2026")
  })

  it("is relative only inside the last 24 hours", () => {
    expect(formatRelative("2026-10-29T09:59:30Z", NOW)).toBe("Just now")
    expect(formatRelative("2026-10-29T09:59:00Z", NOW)).toBe("1 minute ago")
    expect(formatRelative("2026-10-29T08:00:00Z", NOW)).toBe("2 hours ago")
    expect(formatRelative("2026-10-28T10:00:00Z", NOW, "UTC")).toBe("28 Oct 2026")
  })

  it("never reads 60 minutes", () => {
    expect(formatRelative("2026-10-29T09:00:30Z", NOW)).toBe("59 minutes ago")
    expect(formatRelative("2026-10-29T09:00:00Z", NOW)).toBe("1 hour ago")
    expect(formatRelative("2026-10-29T08:01:00Z", NOW)).toBe("1 hour ago")
  })

  it("reads a time still to come", () => {
    expect(formatRelative("2026-10-29T12:00:00Z", NOW)).toBe("in 2 hours")
  })
})

describe("greeting", () => {
  it("follows the store's clock, not the server's", () => {
    expect(greeting("2026-10-29T09:00:00Z", "Europe/Lisbon")).toBe("Good morning")
    expect(greeting("2026-10-29T14:00:00Z", "Europe/Lisbon")).toBe("Good afternoon")
    expect(greeting("2026-10-29T14:00:00Z", "Asia/Tokyo")).toBe("Good evening")
  })
})

describe("names", () => {
  it("spells out country codes and keeps what it can't read", () => {
    expect(countryName("PT")).toBe("Portugal")
    expect(countryName("Atlantis")).toBe("Atlantis")
  })

  it("turns API values into words", () => {
    expect(humanize("partially_refunded")).toBe("Partially refunded")
  })
})
