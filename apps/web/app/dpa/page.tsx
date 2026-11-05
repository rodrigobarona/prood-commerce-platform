import { LegalPage } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.dpa)

const { legal } = siteConfig

const sections = [
  {
    title: "Who does what",
    body: `For the personal data of your store's shoppers, you're the controller and ${legal.name} (NIPC and VAT number ${legal.vat}, ${legal.address}) is your processor. These terms are part of our terms of service and apply while you use Prood.`,
  },
  {
    title: "What we process",
    body: "Shoppers' names, email addresses, phone numbers, delivery and billing addresses, store sign-in details, IP addresses, order history and payment references, for as long as you use Prood, so that we can host your store, take orders and run checkout. We don't store card numbers: those stay with your payment provider.",
  },
  {
    title: "Your instructions",
    body: "We process this data only to run your store and on your documented instructions, which are these terms and how you use Prood. We'll tell you straight away if we think an instruction breaks data protection law.",
  },
  {
    title: "Security",
    body: "Data travels over HTTPS, stores are kept apart, staff access is limited, and payment credentials are encrypted at rest with AES-256-GCM. People who handle the data are bound to keep it confidential.",
  },
  {
    title: "Sub-processors",
    body: "You authorize these sub-processors: Vercel (hosting in Frankfurt, global network), Neon (database, Frankfurt), Upstash (rate limits and checkout sessions, Frankfurt), Cloudflare (public images stored in the EU, global network), Resend (email, primary processing in the US) and Geoapify (address suggestions at checkout). The payment provider you connect is yours, not our sub-processor. We bind each one to the same duties and stay liable for them, and we'll give you at least 30 days' notice before adding or replacing one, except where security or continuity needs it sooner. You can object on reasonable grounds.",
  },
  {
    title: "Transfers",
    body: "Where data can leave the EEA, we rely on the EU-US Data Privacy Framework or Standard Contractual Clauses.",
  },
  {
    title: "Helping you",
    body: "We'll help you answer shoppers' requests, meet your security duties, carry out impact assessments and consult regulators, as far as our role allows.",
  },
  {
    title: "Personal data breaches",
    body: "We'll tell you without undue delay after we become aware of a personal data breach that affects your store's data, with what you need to meet your own duties.",
  },
  {
    title: "Audits",
    body: "We'll give you the information you need to show that these duties are met, and we'll allow for and contribute to audits, with reasonable notice and without exposing other stores' data.",
  },
  {
    title: "When you leave",
    body: "When you stop using Prood, we delete or return your store's personal data, as you choose, unless the law requires us to keep it. Store export isn't built yet, so we do this by hand: email hello@prood.com.",
  },
] as const

export default function DpaPage() {
  return (
    <LegalPage
      title="Data processing terms"
      summary="Under Article 28 of the GDPR, between you as controller and Búzios e Tartarugas, Lda. as processor. Last updated 2 November 2026."
      sections={sections}
      related={[
        { label: "Terms of service", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
      ]}
    />
  )
}
