import { globSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(import.meta.dirname, "../../app/v1/admin")
const routes = globSync("**/route.ts", { cwd: root })

/** Each handler in a route file, with the scope it asks for. */
function handlers(source: string): { method: string; scope: string | undefined }[] {
  return source
    .split(/^export async function /m)
    .slice(1)
    .map((body) => ({
      method: body.slice(0, body.indexOf("(")),
      scope: /requireCaller\("(\w+)"\)/.exec(body)?.[1],
    }))
}

describe("admin routes", () => {
  it("finds the routes", () => {
    expect(routes.length).toBeGreaterThan(10)
  })

  it.each(routes)("%s lets members read and only admins write", (route) => {
    for (const { method, scope } of handlers(readFileSync(resolve(root, route), "utf8"))) {
      expect(`${method}: ${scope}`).toBe(`${method}: ${method === "GET" ? "staff" : "admin"}`)
    }
  })
})
