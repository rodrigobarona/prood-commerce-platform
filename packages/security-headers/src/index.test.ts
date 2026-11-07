import { describe, expect, it } from "vitest"

import { contentSecurityPolicy, originOf, securityHeaders } from "./index"

function directives(policy: string): Map<string, string> {
  return new Map(policy.split("; ").map((part) => [part.split(" ")[0]!, part.split(" ").slice(1).join(" ")]))
}

function headerMap(options?: Parameters<typeof securityHeaders>[0]): Map<string, string> {
  const [rule] = securityHeaders(options)
  return new Map(rule!.headers.map(({ key, value }) => [key, value]))
}

describe("contentSecurityPolicy", () => {
  it("allows only the app itself by default", () => {
    const policy = directives(contentSecurityPolicy({ development: false }))
    expect(policy.get("default-src")).toBe("'self'")
    expect(policy.get("script-src")).toBe("'self' 'unsafe-inline'")
    expect(policy.get("style-src")).toBe("'self' 'unsafe-inline'")
    expect(policy.get("img-src")).toBe("'self' data: blob:")
    expect(policy.get("connect-src")).toBe("'self'")
    expect(policy.get("font-src")).toBe("'self'")
    expect(policy.get("frame-src")).toBe("'none'")
    expect(policy.get("frame-ancestors")).toBe("'none'")
    expect(policy.get("object-src")).toBe("'none'")
    expect(policy.get("base-uri")).toBe("'self'")
    expect(policy.get("form-action")).toBe("'self'")
  })

  it("never hard-codes a host for the app itself", () => {
    expect(contentSecurityPolicy({ development: false })).not.toMatch(/https?:\/\//)
  })

  it("allows eval only in development", () => {
    expect(contentSecurityPolicy({ development: true })).toContain("'unsafe-eval'")
    expect(contentSecurityPolicy({ development: false })).not.toContain("'unsafe-eval'")
  })

  it("follows NODE_ENV when development is not given", () => {
    const before = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = "development"
      expect(contentSecurityPolicy()).toContain("'unsafe-eval'")
      process.env.NODE_ENV = "production"
      expect(contentSecurityPolicy()).not.toContain("'unsafe-eval'")
    } finally {
      process.env.NODE_ENV = before
    }
  })

  it("adds each app's origins to the matching directive only", () => {
    const policy = directives(
      contentSecurityPolicy({
        development: false,
        scriptSrc: ["https://js.stripe.com"],
        connectSrc: ["https://api.stripe.com", "https://m.stripe.network"],
        frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
        imgSrc: ["https://media.example"],
        mediaSrc: ["https://media.example"],
        styleSrc: ["https://styles.example"],
      }),
    )
    expect(policy.get("script-src")).toBe("'self' 'unsafe-inline' https://js.stripe.com")
    expect(policy.get("connect-src")).toBe("'self' https://api.stripe.com https://m.stripe.network")
    expect(policy.get("frame-src")).toBe("https://js.stripe.com https://hooks.stripe.com")
    expect(policy.get("img-src")).toBe("'self' data: blob: https://media.example")
    expect(policy.get("media-src")).toBe("'self' https://media.example")
    expect(policy.get("style-src")).toBe("'self' 'unsafe-inline' https://styles.example")
    expect(policy.get("default-src")).toBe("'self'")
  })

  it("skips unset origins and repeats", () => {
    const policy = directives(
      contentSecurityPolicy({ development: false, imgSrc: [undefined, "https://a.example", "https://a.example", "data:"] }),
    )
    expect(policy.get("img-src")).toBe("'self' data: blob: https://a.example")
  })

  it("lets nothing load for an app that only answers JSON", () => {
    expect(contentSecurityPolicy({ documents: false, scriptSrc: ["https://x.example"] })).toBe(
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    )
  })
})

describe("securityHeaders", () => {
  it("covers every path with one rule", () => {
    const rules = securityHeaders()
    expect(rules).toHaveLength(1)
    expect(rules[0]!.source).toBe("/(.*)")
  })

  it("sends the shared header set", () => {
    const headers = headerMap({ development: false })
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(headers.get("X-Frame-Options")).toBe("DENY")
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin")
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains")
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()")
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'")
  })

  it("marks noindex only when asked", () => {
    expect(headerMap().has("X-Robots-Tag")).toBe(false)
    expect(headerMap({ noindex: true }).get("X-Robots-Tag")).toBe("noindex, nofollow")
  })

  it("delegates payment to the frames that need it", () => {
    expect(headerMap().get("Permissions-Policy")).not.toContain("payment")
    expect(headerMap({ paymentFrames: ["https://js.stripe.com"] }).get("Permissions-Policy")).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
    )
  })
})

describe("originOf", () => {
  it("reduces a URL to its origin", () => {
    expect(originOf("https://prood-media.rbarona.workers.dev/")).toBe("https://prood-media.rbarona.workers.dev")
    expect(originOf("https://cdn.example/media/path")).toBe("https://cdn.example")
  })

  it("is undefined when the variable is unset", () => {
    expect(originOf(undefined)).toBeUndefined()
    expect(originOf("")).toBeUndefined()
  })
})
