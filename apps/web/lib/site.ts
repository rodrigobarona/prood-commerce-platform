import { requiredEnv } from "@prood/types"

const dashboardUrl = requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL").replace(/\/$/, "")
const docsUrl = requiredEnv(process.env.NEXT_PUBLIC_DOCS_URL, "NEXT_PUBLIC_DOCS_URL").replace(/\/$/, "")

export const siteConfig = {
  name: "Prood",
  /** Canonical origin for metadata, sitemap and robots, whatever the deploy URL. */
  url: "https://prood.com",
  title: "Prood: open your store, keep the keys",
  description:
    "Prood is an API-first commerce platform. Get a store on your own domain, take payments through your own Stripe, Easypay or Ifthenpay account, and let developers and AI agents work through the same API. No cut of your sales.",
  email: "hello@prood.com",
  /** Registrable domain for merchant stores; kept apart from prood.com on purpose. */
  storeDomain: "prood.app",
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

export const mainNav = [
  { label: "Agencies", href: "/agencies" },
  { label: "Developers", href: "/developers" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
] as const
