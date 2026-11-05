import { planDefinitions } from "@prood/billing"
import { SCHEMA_CONTEXT, type JsonLdThing } from "@prood/ui/lib/json-ld"
import { siteConfig } from "@/lib/site"

// schema.org descriptions of prood.com, for search engines and answer engines.

/** The company and the site, for the home page. */
export function siteJsonLd(): JsonLdThing[] {
  const { legal } = siteConfig
  return [
    {
      "@context": SCHEMA_CONTEXT,
      "@type": "Organization",
      name: siteConfig.name,
      legalName: legal.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      email: siteConfig.email,
      vatID: `PT${legal.vat}`,
      address: legal.address,
    },
    {
      "@context": SCHEMA_CONTEXT,
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
    },
  ]
}

/** Prood as software you can sign up for. Paid plans aren't on sale yet, so only Free is offered. */
export function softwareJsonLd(): JsonLdThing {
  const free = planDefinitions.free
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      name: free.name,
      price: ((free.monthlyPriceCents ?? 0) / 100).toFixed(2),
      priceCurrency: "EUR",
      url: siteConfig.registerUrl,
    },
  }
}

export function faqJsonLd(items: readonly { question: string; answer: string }[]): JsonLdThing {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}
