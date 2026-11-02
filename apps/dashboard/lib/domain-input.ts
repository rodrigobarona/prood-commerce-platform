const HOW = "Enter it like loja.casalume.example."
const NOT_A_DOMAIN = `We can't add that domain. It doesn't look like a web address. ${HOW}`
const PROOD_DOMAIN = "We can't add that domain. It belongs to Prood. Use a domain you own, like loja.casalume.example."

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
const ENDING = /^([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/
const OWN_DOMAINS = ["prood.com", "prood.app"]

/** The host from whatever was pasted: `https://www.loja.pt/shop` becomes `www.loja.pt`. */
export function normalizeDomain(input: string): { domain: string } | { error: string } {
  const value = input.trim().toLowerCase()
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`
  if (!URL.canParse(withScheme)) return { error: NOT_A_DOMAIN }

  const url = new URL(withScheme)
  if (url.username || url.password) return { error: NOT_A_DOMAIN }
  const domain = url.hostname.replace(/\.$/, "")
  const labels = domain.split(".")
  if (labels.length < 2 || !labels.every((label) => LABEL.test(label))) return { error: NOT_A_DOMAIN }
  if (!ENDING.test(labels.at(-1) ?? "")) return { error: NOT_A_DOMAIN }
  if (OWN_DOMAINS.some((own) => domain === own || domain.endsWith(`.${own}`))) return { error: PROOD_DOMAIN }
  return { domain }
}
