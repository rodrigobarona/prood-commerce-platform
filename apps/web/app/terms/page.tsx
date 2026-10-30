
import { LegalPage } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Terms",
  description:
    "The terms for using Prood.",
  path: "/terms",
})

const sections = [
  {
    title: "The service",
    body: "Prood is a multi-tenant commerce platform: storefronts, a merchant dashboard, hosted checkout and APIs. Features and limits may change while the product evolves.",
  },
  {
    title: "Accounts and stores",
    body: "You're responsible for your store's content, for complying with your payment provider's rules and for activity under your organization. Each store is isolated from every other.",
  },
  {
    title: "Fees",
    body: "Prood doesn't take a cut of your sales. Plan limits and subscriptions will apply once billing starts, with notice first. Payment providers bill you directly.",
  },
  {
    title: "Contact",
    body: "For agency or custom agreements, email hello@prood.com.",
  },
] as const

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      summary="This is a plain-language summary of our terms today. Formal terms will replace it before Prood is generally available."
      sections={sections}
      related={{ label: "Privacy policy", href: "/privacy" }}
    />
  )
}
