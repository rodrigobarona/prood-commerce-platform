
import { LegalPage } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "How Prood handles merchant and customer data.",
  path: "/privacy",
})

const sections = [
  {
    title: "What we collect",
    body: "The account details you give us when you sign up, the store and order data needed to run your store, and technical logs we use to keep the service secure and working.",
  },
  {
    title: "How we use it",
    body: "To host your store, sign you in, store your payment credentials (encrypted per store) and help when you contact us. We don't sell personal data.",
  },
  {
    title: "Your customers' data",
    body: "As a merchant you control your customers' data and are responsible for meeting the privacy laws that apply to your store.",
  },
  {
    title: "Contact",
    body: "For privacy questions or data requests, email hello@prood.com.",
  },
] as const

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      summary="This is a plain-language summary of how we handle data today. A full privacy policy will replace it before Prood is generally available."
      sections={sections}
      related={{ label: "Terms of service", href: "/terms" }}
    />
  )
}
