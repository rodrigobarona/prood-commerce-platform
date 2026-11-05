import { LegalPage } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.privacy)

const { legal } = siteConfig

const sections = [
  {
    title: "Who we are",
    body: `${legal.registeredName} (${legal.name}), NIPC and VAT number ${legal.vat}, ${legal.address}, operates Prood. We're the data controller for the accounts of people who use Prood. For your store's shoppers, you're the controller and we're your processor.`,
  },
  {
    title: "What we collect",
    body: "The account details you give us when you sign up, the store and order data needed to run your store, and technical logs we use to keep the service secure and working.",
  },
  {
    title: "How we use it",
    body: "To host your store, sign you in, keep your payment credentials and help when you contact us. Each store's credentials are stored separately and encrypted at rest with AES-256-GCM. We don't sell personal data.",
  },
  {
    title: "Why we may use it",
    body: "To perform our contract with you, to meet legal duties such as keeping accounting records, and for our legitimate interest in keeping Prood secure and working.",
  },
  {
    title: "Where your data lives",
    body: "Prood's database and application servers run in Frankfurt, Germany, and public images are stored in the EU. Some services we rely on, such as email delivery and the network that serves our pages, can process data outside the EU.",
  },
  {
    title: "Who else handles it",
    body: "Vercel for hosting, Neon for the database, Upstash for rate limits and checkout sessions, Cloudflare for images, and Resend for email. Your store also uses the payment provider you connect, and its checkout uses Geoapify for address suggestions. Where data can leave the EEA, we rely on the EU-US Data Privacy Framework or Standard Contractual Clauses.",
  },
  {
    title: "How long we keep it",
    body: "For as long as your account is open, then only as long as the law requires, for example for accounting records.",
  },
  {
    title: "Cookies",
    body: "We use the cookies needed to sign you in, keep a cart working and remember your dashboard layout. Stripe's checkout can set its own fraud-prevention cookies. Stores also keep saved items and checkout details in the shopper's browser. We don't use tracking or advertising cookies.",
  },
  {
    title: "Your rights",
    body: "Under the GDPR you can ask to see, correct, delete or move your personal data, and you can restrict or object to how we use it. Email hello@prood.com and we'll reply. You can also complain to the Comissão Nacional de Proteção de Dados (CNPD) at cnpd.pt.",
  },
  {
    title: "Your customers' data",
    body: "As a merchant you control your customers' data and are responsible for meeting the privacy laws that apply to your store. Our data processing terms at /dpa set out how we handle it for you.",
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
      summary="How Búzios e Tartarugas, Lda. handles personal data for Prood. Last updated 2 November 2026."
      sections={sections}
      related={[
        { label: "Terms of service", href: "/terms" },
        { label: "Data processing terms", href: "/dpa" },
      ]}
    />
  )
}
