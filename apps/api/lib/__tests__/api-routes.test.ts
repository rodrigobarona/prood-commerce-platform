import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { methodsForPath } from "../agent-capability"
import { GET, POST } from "../../app/v1/[...path]/route"
import { GET as GET_ROOT } from "../../app/v1/route"
import { readBody } from "../validate"
import { errorResponse } from "../api"
import { adminListCustomersQuery, adminListQuery, couponBody } from "../schemas"

const V1 = join(import.meta.dirname, "../../app/v1")

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? routeFiles(path) : entry.name === "route.ts" ? [path] : []
  })
}

describe("the proxy's 405", () => {
  // It answers from the spec, so a method the spec missed would be refused for real.
  // The 404 routes take every method, and have no spec entry to find.
  const served = routeFiles(V1).filter((file) => !file.includes("[...path]") && file !== join(V1, "route.ts"))

  it.each(served)("doesn't block a method of %s", (file) => {
    const exported = [...readFileSync(file, "utf8").matchAll(/export (?:async function|const) (GET|POST|PUT|PATCH|DELETE)\b/g)]
      .map((match) => match[1])
    const path = `/v1/${relative(V1, join(file, "..")).replace(/\[[^\]]+\]/g, "x")}`.replace(/\/$/, "")

    const allowed = methodsForPath(path)
    expect(allowed).toEqual(expect.arrayContaining(exported))
  })
})

describe("an unknown /v1 path", () => {
  it.each([
    ["GET", GET],
    ["POST", POST],
    ["GET on /v1 itself", GET_ROOT],
  ])("answers %s in the API's error shape", async (_, handler) => {
    const response = handler()

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ code: "NOT_FOUND", message: expect.any(String) })
  })
})

describe("readBody", () => {
  const request = (body?: string) => new Request("https://api.test/v1", { method: "POST", body })

  it("says the JSON is broken, not that fields are missing", async () => {
    const response = errorResponse(await readBody(request("{oops"), couponBody).catch((err: unknown) => err))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "VALIDATION",
      message: "We couldn't read this request. The body isn't valid JSON. Fix it and send it again.",
    })
  })

  it("still reads an empty body as no fields", async () => {
    const response = errorResponse(await readBody(request(), couponBody).catch((err: unknown) => err))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ errors: [{ path: "code" }] })
  })

  it("parses a good body", async () => {
    await expect(readBody(request('{"code":"SUMMER"}'), couponBody)).resolves.toEqual({ code: "SUMMER" })
  })
})

describe("customer sorting", () => {
  it.each(["createdAt", "spent"])("takes %s", (sortField) => {
    expect(adminListCustomersQuery.parse({ sortField }).sortField).toBe(sortField)
  })

  it("refuses a field it can't sort on, which products still take as text", () => {
    expect(adminListCustomersQuery.safeParse({ sortField: "email" }).success).toBe(false)
    expect(adminListQuery.safeParse({ sortField: "email" }).success).toBe(true)
  })
})
