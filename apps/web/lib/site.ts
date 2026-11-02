import { requiredEnv } from "@prood/types"

const dashboardUrl = requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL").replace(/\/$/, "")
const docsUrl = requiredEnv(process.env.NEXT_PUBLIC_DOCS_URL, "NEXT_PUBLIC_DOCS_URL").replace(/\/$/, "")

export const siteConfig = {
  name: "Prood",
  /** Canonical origin for metadata, sitemap and robots, whatever the deploy URL. */
  url: "https://prood.com",
  title: "Prood: commerce, ready to run",
  description:
    "Prood is hosted, API-first commerce. Run your store on your own domain, take Multibanco and MB WAY through your own Easypay or Ifthenpay account or cards through Stripe, and give developers and AI agents an API.",
  email: "hello@prood.com",
  /** The company behind Prood. Public registry facts only: see _docs/LEGAL.md. */
  legal: {
    name: "Búzios e Tartarugas, Lda.",
    registeredName: "BÚZIOS E TARTARUGAS - LDA",
    vat: "515001708",
    address: "Rua Gil Vicente 2, 2775-198 Parede, Portugal",
  },
  /** Registrable domain for merchant stores; kept apart from prood.com on purpose. */
  storeDomain: "prood.app",
  demoStoreUrl: "https://prood-demo.prood.app",
  registerUrl: `${dashboardUrl}/register`,
  loginUrl: `${dashboardUrl}/login`,
  docsUrl: `${docsUrl}/docs`,
  apiReferenceUrl: `${docsUrl}/docs/api`,
} as const

export function docsPage(path: string) {
  return `${siteConfig.docsUrl}/${path}`
}

export const contactHref = (subject: string) =>
  `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`

/** Routes that open on a full-bleed image, so the header starts transparent over it. */
export const overlayRoutes = ["/", "/agencies", "/integrations", "/pricing"] as readonly string[]

export const mainNav = [
  { label: "Agencies", href: "/agencies" },
  { label: "Developers", href: "/developers" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
] as const
