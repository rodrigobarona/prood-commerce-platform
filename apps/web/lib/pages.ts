import { siteConfig } from "@/lib/site"

export type PageSection = "Product" | "About" | "Legal"

export interface SitePage {
  /** Left out on the home page, which takes the site's own title. */
  title?: string
  description: string
  path: `/${string}`
  /** Sitemap priority. */
  priority: number
  /** Where `llms.txt` lists it. */
  section: PageSection
}

/** Every page of prood.com: its metadata, sitemap entry and `llms.txt` line come from here. */
export const pages = {
  home: {
    description: siteConfig.description,
    path: "/",
    priority: 1,
    section: "Product",
  },
  product: {
    title: "Product",
    description: "A hosted storefront, checkout, orders and an API. Nothing to deploy: run your store on your own domain and your own payment accounts.",
    path: "/product",
    priority: 0.9,
    section: "Product",
  },
  pricing: {
    title: "Pricing",
    description: "Free for 50 products and 100 orders a month, with your own domain. Paid plans for more orders, a bigger team and AI agents are coming.",
    path: "/pricing",
    priority: 0.9,
    section: "Product",
  },
  merchants: {
    title: "For merchants",
    description: "A storefront, checkout and orders, ready when you sign up. Take Multibanco, MB WAY and cards through your own payment account, on your own domain.",
    path: "/merchants",
    priority: 0.8,
    section: "Product",
  },
  agencies: {
    title: "For agencies",
    description: "Checkout, admin and the Multibanco and MB WAY connections are already built. Each client store has its own data, payment accounts and domain, all from one login.",
    path: "/agencies",
    priority: 0.8,
    section: "Product",
  },
  developers: {
    title: "For developers and AI agents",
    description: "A REST API with more than 40 operations, an OpenAPI 3.1 spec, a TypeScript client, the prood CLI and an MCP server with 41 tools. With Agent Auth, an AI agent starts with nothing until you approve it for your store.",
    path: "/developers",
    priority: 0.8,
    section: "Product",
  },
  integrations: {
    title: "Integrations",
    description: "Connect Stripe, Easypay or Ifthenpay with your own accounts, bring your own domain, and build on the REST API and MCP server.",
    path: "/integrations",
    priority: 0.8,
    section: "Product",
  },
  design: {
    title: "Design system",
    description: "The Prood design system: receipt paper, the roof tile and the people behind the counter. Color, type, components and photography across every Prood app.",
    path: "/design",
    priority: 0.4,
    section: "About",
  },
  credits: {
    title: "Photo and film credits",
    description: "The photographers and filmmakers whose work appears across Prood's sites and apps.",
    path: "/credits",
    priority: 0.3,
    section: "About",
  },
  privacy: {
    title: "Privacy",
    description: "How Prood handles personal data, and where it lives.",
    path: "/privacy",
    priority: 0.3,
    section: "Legal",
  },
  terms: {
    title: "Terms",
    description: "The terms for using Prood, operated by Búzios e Tartarugas, Lda.",
    path: "/terms",
    priority: 0.3,
    section: "Legal",
  },
  dpa: {
    title: "Data processing terms",
    description: "How Prood processes personal data for merchants, under Article 28 of the GDPR.",
    path: "/dpa",
    priority: 0.3,
    section: "Legal",
  },
} as const satisfies Record<string, SitePage>
