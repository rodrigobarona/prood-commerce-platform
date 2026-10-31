import { describe, expect, it, vi } from "vitest"
import { latestOnly } from "../latest-only"

function deferredSave() {
  const calls: { value: string; resolve: () => void; reject: (err: Error) => void }[] = []
  const save = vi.fn(
    (value: string) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ value, resolve, reject })
      }),
  )
  return { calls, save }
}

const settle = () => new Promise((resolve) => setTimeout(resolve))

describe("latestOnly", () => {
  it("sends a lone value", async () => {
    const { calls, save } = deferredSave()
    const done = latestOnly(save)("standard")
    calls[0]?.resolve()
    await done
    expect(save).toHaveBeenCalledOnce()
  })

  it("saves the last choice last, and skips the ones in between", async () => {
    const { calls, save } = deferredSave()
    const choose = latestOnly(save)

    const all = Promise.all([choose("standard"), choose("express"), choose("pickup")])
    expect(save).toHaveBeenCalledOnce()

    calls[0]?.resolve()
    await settle()
    calls[1]?.resolve()
    await all

    expect(save.mock.calls.map(([value]) => value)).toEqual(["standard", "pickup"])
  })

  it("doesn't save again when the choice came back to the one in flight", async () => {
    const { calls, save } = deferredSave()
    const choose = latestOnly(save)

    const all = Promise.all([choose("standard"), choose("express"), choose("standard")])
    calls[0]?.resolve()
    await all

    expect(save).toHaveBeenCalledOnce()
  })

  it("forgets a failure the newer choice replaced", async () => {
    const { calls, save } = deferredSave()
    const choose = latestOnly(save)

    const all = Promise.all([choose("standard"), choose("express")])
    calls[0]?.reject(new Error("save failed"))
    await settle()
    calls[1]?.resolve()

    await expect(all).resolves.toBeDefined()
  })

  it("reports the failure of the last choice to every caller, and can run again", async () => {
    const { calls, save } = deferredSave()
    const choose = latestOnly(save)

    const results = Promise.allSettled([choose("standard"), choose("express")])
    calls[0]?.resolve()
    await settle()
    calls[1]?.reject(new Error("save failed"))

    expect((await results).map((result) => result.status)).toEqual(["rejected", "rejected"])

    const retry = choose("express")
    calls[2]?.resolve()
    await expect(retry).resolves.toBeUndefined()
  })
})
