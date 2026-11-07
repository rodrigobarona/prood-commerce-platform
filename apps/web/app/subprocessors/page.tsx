import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.subprocessors)

const { legal } = siteConfig

const sections: readonly LegalSection[] = [
  {
    title: "Sub-processors for Customer Data",
    id: "customer-data",
    body: [
      "These are the companies that process personal data for Prood's customers, and the list the [data processing terms](/dpa) refer to. Customers' owners get 30 days' notice by email before a change, and may object as the agreement explains.",
      {
        table: {
          head: ["Company", "Service", "Where", "Transfer safeguard", "Certifications they state"],
          rows: [
            [
              "Vercel Inc. (USA)",
              "Hosting, delivery network, firewall, logs",
              "Functions in Frankfurt. Delivery network worldwide. Logs may be processed in the USA",
              "EU–US Data Privacy Framework, and Standard Contractual Clauses",
              "SOC 2 Type 2, ISO 27001:2022. [security.vercel.com](https://security.vercel.com)",
            ],
            [
              "Databricks, Inc. and Neon, LLC (USA)",
              "Database",
              "Frankfurt (AWS eu-central-1)",
              "Standard Contractual Clauses",
              "SOC 2 Type II, ISO 27001:2022, ISO 27701:2019. [Databricks sub-processors](https://www.databricks.com/legal/databricks-subprocessors)",
            ],
            [
              "Upstash, Inc. (USA)",
              "Checkout sessions and rate limits",
              "Frankfurt",
              "Standard Contractual Clauses",
              "SOC 2 Type II. [upstash.com/trust](https://upstash.com/trust)",
            ],
            [
              "Cloudflare, Inc. (USA)",
              "Public image storage (R2, EU jurisdiction) and delivery",
              "Stored in the EU. Delivered from a global network",
              "EU–US Data Privacy Framework, and Standard Contractual Clauses",
              "SOC 2 Type II, ISO 27001, ISO 27701. [cloudflare.com/trust-hub](https://www.cloudflare.com/trust-hub/)",
            ],
            [
              "Plus Five Five, Inc., trading as Resend (USA)",
              "Order and service email",
              "Message data and logs stored in the USA",
              "Standard Contractual Clauses",
              "SOC 2 Type II. [resend.com/legal/subprocessors](https://resend.com/legal/subprocessors)",
            ],
            [
              "Geoapify (Keptagon s.r.o., Czech Republic)",
              "Address suggestions at checkout",
              "European Union",
              "None needed",
              "None stated. [geoapify.com](https://www.geoapify.com)",
            ],
          ],
        },
      },
    ],
  },
  {
    title: "Providers for Prood's own data",
    id: "own-data",
    body: [
      "We use these for data we control ourselves, as our [privacy policy](/privacy) explains. They do not process Customer Data.",
      {
        table: {
          head: ["Company", "Service", "Where", "Transfer safeguard"],
          rows: [
            ["INTH", "Privacy banner and consent records for prood.com and stores", "Frankfurt", "Not needed for storage. Support access from outside the EEA is covered by its data processing terms"],
            ["Stripe Payments Europe, Ltd. (Ireland)", "Collects Prood's plan fees, once paid plans can be bought", "EU and USA", "EU–US Data Privacy Framework, and Standard Contractual Clauses"],
            ["Vercel Inc. (USA)", "Visit statistics, only if a visitor allows them", "As above", "As above"],
            ["Plus Five Five, Inc., trading as Resend (USA)", "Account email and our own mail", "As above", "As above"],
          ],
        },
      },
      "A store's own payment provider (Stripe, Easypay or Ifthenpay) is the store's provider, under the store's own contract. It is not our sub-processor.",
    ],
  },
  {
    title: "Jurisdiction and government access",
    id: "jurisdiction",
    body: [
      "Under Article 28 of Regulation (EU) 2023/2854 (the Data Act), we publish the following.",
      "The infrastructure in the first table runs in the European Union where the table says so. It is operated by companies established in the United States, so it is subject to the laws of the United States as well as those of the EU.",
      "Our measures against international government access to non-personal data held in the Union are these. Application and database processing run in the Frankfurt region. Data is encrypted in transit and at rest. The encryption keys are held by our providers, so encryption does not by itself stop a request addressed to them. We will tell the Customer of any request made to us unless the law forbids it, and will disclose only what the law requires.",
      "For personal data, the Standard Contractual Clauses also require the provider to review the lawfulness of a request, to challenge it where there are grounds to do so, and to notify us where it can.",
    ],
  },
]

export default function SubprocessorsPage() {
  return (
    <LegalPage
      title="Sub-processors"
      summary={`The companies that process personal data for Prood, run by ${legal.name}. Last updated ${legal.updated}.`}
      sections={sections}
      related={[
        { label: "Data processing terms", href: "/dpa" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Terms of service", href: "/terms" },
      ]}
    />
  )
}
