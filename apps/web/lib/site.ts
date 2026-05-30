export const siteConfig = {
  name: "Prood",
  tagline: "Sell online without the setup tax",
  description:
    "Launch a real store on prood.app, connect payments with your own keys, and run orders from dashboard.prood.com. No Prood cut on your sales.",
  marketingDomain: "prood.com",
  /** Apex for tenant storefront subdomains only — not platform services. */
  storeDomain: "prood.app",
  /** Shared platform services on prood.com (Vercel.com / Vercel.app split). */
  platformHosts: {
    dashboard: "dashboard.prood.com",
    api: "api.prood.com",
    checkout: "pay.prood.com",
    docs: "docs.prood.com",
  },
  url: process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001",
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3003",
  storefrontUrl: process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000",
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3002",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005",
  registerUrl:
    `${process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3002"}/register`,
} as const

export const siteAnnouncement = {
  message: "Free store on prood.app—included on Free.",
  href: "/pricing",
  linkLabel: "See plans",
} as const

export const heroCopy = {
  badge: "0% Prood fee on your sales",
  title: "Your store, live today.",
  titleAccent: "Upgrade when you need more.",
  subline:
    `Every store gets a free subdomain on ${siteConfig.storeDomain}—your brand URL on day one. Connect Stripe, Easypay, or Ifthenpay with your keys; you keep what you earn, minus your processor.`,
  trustLine: `Free to start · yourname.${siteConfig.storeDomain} included · Admin at ${siteConfig.platformHosts.dashboard}`,
} as const

export const valueStripItems = [
  {
    title: "Keep your margin",
    description:
      "You pay your payment provider directly. Prood does not take a cut of your sales.",
  },
  {
    title: "Your keys, your accounts",
    description:
      "Stripe and regional providers connect per store. Credentials stay encrypted—built for agencies with client-owned merchants.",
  },
  {
    title: "Look professional from day one",
    description:
      `Your store goes live on yourname.${siteConfig.storeDomain} instantly. Connect shop.yourbrand.com on Free when you want a fully owned domain.`,
  },
] as const

export const marketingStats = [
  { label: "Store subdomain", value: `yourname.${siteConfig.storeDomain}` },
  { label: "Prood fee on sales", value: "0%" },
  { label: "Typical time to first order", value: "Under an hour" },
] as const

export const logoCloudPlaceholder = {
  headline: "For merchants who want a store—not a stack of plugins",
  names: [] as string[],
} as const

export const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Agencies", href: "/agencies" },
  { label: "Integrations", href: "/integrations" },
  { label: "AI", href: "/ai" },
] as const

export const pillars = [
  {
    title: "Go live fast",
    description:
      "Sign up, add products, share your URL. Most merchants run a test checkout the same afternoon.",
  },
  {
    title: "Run one calm admin",
    description:
      "Catalog, orders, customers, payments, and domains in one place—no app store, no theme surgery.",
  },
  {
    title: "Scale on your terms",
    description:
      "Stay on Free while it fits. Move to Grow for team seats, higher limits, and Agent Auth when the business asks for it.",
  },
] as const

export const howItWorksSteps = [
  {
    step: "01",
    title: "Create your store",
    description: `Email, store name, done. Your store on ${siteConfig.storeDomain} and admin at ${siteConfig.platformHosts.dashboard} are ready in minutes.`,
  },
  {
    step: "02",
    title: "Add catalog and payments",
    description: "Publish products and connect Stripe, Easypay, or Ifthenpay—encrypted per store, your accounts only.",
  },
  {
    step: "03",
    title: "Sell on your URL",
    description: `Share yourname.${siteConfig.storeDomain} or connect your own domain on Free. Orders land in ${siteConfig.platformHosts.dashboard} as they come in.`,
  },
] as const

export const dashboardFeatures = [
  {
    title: "Products & catalog",
    description: "Variants, images, categories, and inventory in one workflow.",
  },
  {
    title: "Orders & customers",
    description: "Fulfill, refund, and see purchase history without switching tools.",
  },
  {
    title: "Integrations",
    description: "Payment providers per store—never shared keys across merchants.",
  },
  {
    title: "Domains & team",
    description: `Storefront on yourname.${siteConfig.storeDomain} from day one, custom domain on Free, team and agents on paid plans.`,
  },
] as const

export const agentExamples = [
  {
    title: "Orders",
    description: "List, filter, and update fulfillment the same way your team does in the dashboard.",
  },
  {
    title: "Catalog",
    description: "Create and adjust products and stock when you approve write access.",
  },
  {
    title: "Guardrails",
    description: "Every store is isolated. Sensitive changes wait for your explicit approval in Agent Auth.",
  },
] as const

export const agencyHighlights = [
  {
    title: "One platform, many clients",
    description: "Each client is its own organization—separate catalog, payments, and data.",
  },
  {
    title: "Their domain, their checkout",
    description: `Stage on yourname.${siteConfig.storeDomain}, production on shop.client.com—with SSL handled for you.`,
  },
  {
    title: "Invite without sharing passwords",
    description: "Give clients admin or member access per store while your agency keeps control.",
  },
] as const

export const merchantPainItems = [
  {
    title: "Weeks of setup before the first sale",
    timeCost: "4+ hrs / week",
    description: "Themes, apps, and checkout tweaks stacked on top of each other.",
  },
  {
    title: "Extra fees on every order",
    timeCost: "Adds up fast",
    description: "Penalties for using Stripe or PayPal instead of the platform’s own payments.",
  },
  {
    title: "Paying to look credible",
    timeCost: "Days delayed",
    description: "Custom domains and branding locked behind plans before the store feels real.",
  },
] as const

export const merchantGainItems = [
  {
    title: "Live store in one sitting",
    timeCost: "~30–60 min",
    description: `Subdomain on ${siteConfig.storeDomain}, catalog, and checkout ready for a real test order today.`,
  },
  {
    title: "Clear economics",
    timeCost: "0% Prood fee",
    description: "Your processor bills you. Prood does not take a cut of your orders.",
  },
  {
    title: "Automation when you’re ready",
    timeCost: "On Grow+",
    description: "Agent Auth and full API after volume and team needs show up—not on day one.",
  },
] as const

export const techStack = [
  "Next.js",
  "Neon",
  "Vercel",
  "Stripe",
  "PostgreSQL",
  "Upstash",
] as const

export const pricingDisclaimer =
  "Processing fees are paid to your provider (Stripe, Easypay, etc.). Prood does not charge a fee on your sales at launch. Plan limits below reflect upcoming subscriptions—we’ll announce before billing goes live."

export function formatStoreHost(slug: string) {
  return `${slug}.${siteConfig.storeDomain}`
}

export function formatDashboardPath(path = "") {
  const normalized = path.replace(/^\//, "")
  const host = siteConfig.platformHosts.dashboard
  return normalized ? `${host}/${normalized}` : host
}
