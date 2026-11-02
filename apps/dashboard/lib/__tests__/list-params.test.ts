import { describe, expect, it } from "vitest"
import { lastPage, listHref, nextDirection, readListState } from "@prood/ui/lib/list-params"

describe("readListState", () => {
  it("starts on page one with nothing in the URL", () => {
    const list = readListState({})
    expect(list).toMatchObject({ q: "", page: 1, perPage: 25, offset: 0, tab: undefined, params: {} })
  })

  it("reads a real view", () => {
    const list = readListState(
      { q: " ana ", status: "placed", page: "3", sort: "price", dir: "asc" },
      { tabs: ["placed"], sorts: ["name", "price"], defaultSort: "name" },
    )
    expect(list).toMatchObject({ q: "ana", tab: "placed", page: 3, offset: 50, sort: "price", dir: "asc" })
    expect(list.params).toEqual({ q: "ana", status: "placed", page: "3", sort: "price", dir: "asc" })
  })

  it("ignores what a person typed that doesn't exist", () => {
    const list = readListState(
      { status: "banana", sort: "email", dir: "sideways", page: "-4" },
      { tabs: ["placed"], sorts: ["name"], defaultSort: "name" },
    )
    expect(list).toMatchObject({ tab: undefined, sort: "name", dir: "desc", page: 1, params: {} })
  })

  it("carries a kept parameter on its links", () => {
    const list = readListState({ customer: "c1", other: "x" }, { keep: ["customer"] })
    expect(list.params).toEqual({ customer: "c1" })
  })
})

describe("listHref", () => {
  it.each(["1e30", "Infinity", "2.5", "abc"])("lands on page one for page=%s", (page) => {
    expect(readListState({ page })).toMatchObject({ page: 1, offset: 0 })
  })

  it("clamps a page far past any list, so the offset stays a real integer", () => {
    const { offset } = readListState({ page: "9007199254740991" })
    expect(Number.isSafeInteger(offset)).toBe(true)
    expect(offset).toBeLessThan(2 ** 31)
  })

  it("sends a new search back to page one", () => {
    expect(listHref("/orders", { page: "4", status: "placed" }, { q: "ORD" })).toBe("/orders?status=placed&q=ORD")
  })

  it("keeps filters while paging, and drops page one from the URL", () => {
    expect(listHref("/orders", { q: "ORD" }, { page: 2 })).toBe("/orders?q=ORD&page=2")
    expect(listHref("/orders", { q: "ORD", page: "2" }, { page: 1 })).toBe("/orders?q=ORD")
  })

  it("clears a value set to nothing", () => {
    expect(listHref("/orders", { status: "placed" }, { status: undefined })).toBe("/orders")
  })
})

describe("nextDirection", () => {
  it("starts a new column on its first direction, then flips", () => {
    expect(nextDirection({ sort: "name", dir: "asc" }, "price", "desc")).toBe("desc")
    expect(nextDirection({ sort: "price", dir: "desc" }, "price", "desc")).toBe("asc")
  })
})

describe("lastPage", () => {
  it("finds the last page, and never goes below one", () => {
    expect(lastPage(51, 25)).toBe(3)
    expect(lastPage(50, 25)).toBe(2)
    expect(lastPage(0, 25)).toBe(1)
  })
})
