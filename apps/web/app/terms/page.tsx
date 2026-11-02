import { LegalPage } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Terms",
  description: "The terms for using Prood, operated by Búzios e Tartarugas, Lda.",
  path: "/terms",
})

const { legal } = siteConfig

const sections = [
  {
    title: "Who we are",
    body: `Prood is operated by ${legal.registeredName} (${legal.name}), a Portuguese company with NIPC and VAT number ${legal.vat}, registered at the Conservatória do Registo Comercial de Cascais, with its registered office at ${legal.address}.`,
  },
  {
    title: "The service",
    body: "Prood is a commerce platform: storefronts, a merchant dashboard, hosted checkout and APIs. It's for businesses, and it's in an early stage, so features and limits may change. What isn't built yet is listed on the pricing page.",
  },
  {
    title: "Accounts and stores",
    body: "You're responsible for your store's content, for following your payment provider's rules, for what you sell, for the taxes on your sales and for activity under your organization. Each store is kept separate from every other.",
  },
  {
    title: "Your payment accounts",
    body: "Your shoppers pay through your own Stripe, Easypay or Ifthenpay account. Your contract with that provider is yours, and its fees are yours to pay. Prood doesn't hold your money.",
  },
  {
    title: "Fees",
    body: "Prood charges by plan, not by sale. Free limits apply today: at 50 products you can't add more, and at 100 orders in a month new orders are refused until the next month. Paid plans can't be bought yet, and subscriptions will start only after notice. Prices are in euros. VAT is added where it applies, and we'll issue an invoice for every payment.",
  },
  {
    title: "Your data",
    body: "Your store's data stays yours. For personal data about your shoppers you're the controller and we're your processor, under our data processing terms at /dpa.",
  },
  {
    title: "Acceptable use",
    body: "Don't use Prood to sell anything illegal, to break into other people's systems or data, or to harm the service or other stores. We can suspend a store that does.",
  },
  {
    title: "Ending your use",
    body: "You can stop using Prood at any time. Email us to close your account. Store export isn't built yet, so ask us first if you need a copy of your data.",
  },
  {
    title: "Liability",
    body: "We work to keep Prood running and secure, but it's provided as it is, without a promise that it'll always be available. Nothing here limits liability that the law doesn't allow us to limit.",
  },
  {
    title: "Law and complaints",
    body: "These terms follow Portuguese law, and the courts of Cascais have jurisdiction, unless mandatory law says otherwise. Complaints can go to hello@prood.com or to the electronic complaints book at livroreclamacoes.pt.",
  },
  {
    title: "Changes and contact",
    body: "We'll tell you before a change that affects you takes effect. For agency or custom agreements, or anything else, email hello@prood.com.",
  },
] as const

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      summary="Plain-language terms between you and Búzios e Tartarugas, Lda. Last updated 2 November 2026."
      sections={sections}
      related={[
        { label: "Privacy policy", href: "/privacy" },
        { label: "Data processing terms", href: "/dpa" },
      ]}
    />
  )
}
