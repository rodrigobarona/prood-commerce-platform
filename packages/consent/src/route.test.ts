import { describe, expect, it } from "vitest"

import { LOCATION_HEADERS, withoutLocationHeaders } from "./route"

describe("withoutLocationHeaders", () => {
  it("drops every header c15t reads for the visitor's location", () => {
    const headers = new Headers({ "accept-language": "pt-PT", "user-agent": "test" })
    for (const name of LOCATION_HEADERS) headers.set(name, "US")
    const out = withoutLocationHeaders(new Request("https://prood.com/api/c15t/init", { headers }))
    for (const name of LOCATION_HEADERS) expect(out.headers.has(name)).toBe(false)
  })

  it("keeps the other headers, the URL and the method", () => {
    const out = withoutLocationHeaders(
      new Request("https://prood.com/api/c15t/init?x=1", {
        headers: { "accept-language": "de", "x-vercel-ip-country": "BR" },
      }),
    )
    expect(out.headers.get("accept-language")).toBe("de")
    expect(out.url).toBe("https://prood.com/api/c15t/init?x=1")
    expect(out.method).toBe("GET")
  })

  it("passes a saved choice through unchanged", async () => {
    const body = JSON.stringify({ type: "cookie_banner", preferences: { measurement: true } })
    const out = withoutLocationHeaders(
      new Request("https://prood.com/api/c15t/subjects", {
        method: "POST",
        headers: { "content-type": "application/json", "x-vercel-ip-country": "US" },
        body,
      }),
    )
    expect(out.method).toBe("POST")
    expect(await out.text()).toBe(body)
  })
})
