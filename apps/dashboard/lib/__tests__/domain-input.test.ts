import { describe, expect, it } from "vitest"
import { normalizeDomain } from "../domain-input"

describe("normalizeDomain", () => {
  it.each([
    ["loja.pt", "loja.pt"],
    ["  LOJA.Yourbrand.PT ", "loja.yourbrand.pt"],
    ["https://www.loja.pt/", "www.loja.pt"],
    ["http://loja.pt:8080/shop?x=1", "loja.pt"],
    ["loja.pt.", "loja.pt"],
    ["padaria-ribeiro.co.uk", "padaria-ribeiro.co.uk"],
  ])("reads %s as %s", (input, domain) => {
    expect(normalizeDomain(input)).toEqual({ domain })
  })

  it.each(["", "loja", "loja pt", "ana@loja.pt", "192.168.1.1", "-loja.pt", "loja.p", "https://", "ló ja.pt"])(
    "explains what's wrong with %j",
    (input) => {
      expect(normalizeDomain(input)).toEqual({ error: expect.stringMatching(/^We can't add that domain\. /) })
    }
  )

  it.each(["prood.app", "acme.prood.app", "dashboard.prood.com"])("keeps %s for Prood", (input) => {
    expect(normalizeDomain(input)).toEqual({ error: expect.stringContaining("belongs to Prood") })
  })
})
