import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.terms)

const { legal, email } = siteConfig

const sections: readonly LegalSection[] = [
  {
    title: "Who we are",
    id: "who",
    body: [
      `Prood is operated by **${legal.registeredName}** (“${legal.name}”, “Prood”, “we”), a Portuguese private limited company with NIPC and VAT number ${legal.vat}, registered at the ${legal.registry}, with its registered office at ${legal.address}.`,
      `Company details are in the [legal notice](/legal). Contact: [${email}](mailto:${email}).`,
    ],
  },
  {
    title: "The contract",
    id: "contract",
    body: [
      "These terms and our [data processing terms](/dpa) form the contract between us and the organization you create or join in Prood (the “Customer”). It starts when someone creates an account for the organization, or uses Prood for it, after being shown these terms. That person confirms that they are allowed to bind the organization.",
      "Prood is for professional use. The Customer confirms that it acts for business purposes and is not a consumer.",
      "Shoppers who buy from a store are not our customers. They buy from the store's owner, on that owner's terms. We are not a party to those sales.",
      "These documents stay available on this site to read, save and print. Earlier versions are available on request.",
    ],
  },
  {
    title: "The service",
    id: "service",
    body: [
      "Prood is a commerce platform: storefronts on `{store}.prood.app` or on the Customer's own domain, a merchant dashboard, hosted checkout, a REST API, an MCP server and Agent Auth for AI agents.",
      "Prood is in an early stage. Features and limits may change, and there is no service-level commitment. What is not built yet is listed on the [pricing](/pricing) and [merchants](/merchants) pages, and we don't promise it until it is. The service runs on the infrastructure and with the subcontractors listed on our [sub-processors page](/subprocessors), which forms part of this contract.",
      "Prood does not rank, list or promote stores in a marketplace or search of its own, so no ranking rules apply.",
    ],
  },
  {
    title: "Accounts and team",
    id: "accounts",
    body: [
      "Give accurate details and keep your sign-in details and API keys secret. The Customer is responsible for what its members, API keys and approved agents do, for choosing members and their roles (owner, admin or member), and for removing access that is no longer needed.",
      `Tell us promptly at [${email}](mailto:${email}) if you suspect misuse of an account or key.`,
    ],
  },
  {
    title: "Your store and your responsibilities",
    id: "store",
    body: [
      "The Customer is the seller of everything sold in its store. It keeps all rights in the content it publishes (“Customer Data”), including product text, images, prices and policies, and gives us the rights we need to host, display, copy and transmit it so as to provide the service. Publishing makes content public, and we cannot recall copies others make.",
      "The Customer is responsible for:",
      {
        list: [
          "what it sells, and for having the right to sell it and to use the names, images and domain names it enters;",
          "the information shoppers must be given before they buy, such as the seller's identity and address, prices with taxes, delivery costs and times, and the right of withdrawal and returns, under Portuguese and EU consumer and e-commerce law (including Decree-Law 24/2014 and Decree-Law 7/2004);",
          "publishing its own privacy notice, terms of sale and returns information. Prood doesn't yet provide fields or default text for these, so the Customer has to link or place them itself, for example in its product pages or through its contact email;",
          "its taxes, including VAT on its sales, and the invoices and accounting records it owes its customers. Prood does not yet calculate VAT or issue invoices for merchants;",
          "delivering orders, handling returns, refunds and complaints, and answering shoppers;",
          "being the controller of its shoppers' personal data, as the [data processing terms](/dpa) explain.",
        ],
      },
      "Prood provides tools. It doesn't check a store's content against the law, and using Prood doesn't by itself make a store compliant.",
    ],
  },
  {
    title: "Payments",
    id: "payments",
    body: [
      "Shoppers pay through the Customer's own Stripe, Easypay or Ifthenpay account. The Customer's contract with that provider is its own, and so are the provider's fees and rules. Prood doesn't hold, receive or transfer the Customer's money, and is not a payment institution.",
      "The Customer gives us its provider credentials so that Prood can create payments, receive the provider's confirmations and show order status. We store them encrypted. The Customer must revoke them at the provider if it ends the contract or suspects misuse, and is responsible for what its provider account does. Prood is not responsible for a payment provider's service, availability, fees or decisions.",
    ],
  },
  {
    title: "Plans, fees and taxes",
    id: "fees",
    body: [
      "Prood charges by plan, not by sale. Every store is on the Free plan today. It includes one store, 50 products, 100 orders a month, one team seat and one custom domain. At the limit, new products or orders are refused until the Customer is under it again or, for orders, until the next month.",
      "Paid plans can't be bought yet. When they can, their prices will be shown in euros on the [pricing](/pricing) page, excluding VAT. Fees apply only if the Customer expressly chooses and accepts a paid plan. Staying on Free, or not answering, is never acceptance of fees. We will give at least 60 days' notice before we change a limit of the Free plan in a way that matters, and the Customer may leave without charge during that time.",
      "Once paid plans exist: they renew monthly until cancelled, cancellation takes effect at the end of the paid period, and we issue an invoice for every payment as Portuguese law requires. Paid plans are billed through Stripe. Fees already paid for a period are not refunded, unless the law says otherwise.",
    ],
  },
  {
    title: "Store addresses and domains",
    id: "domains",
    body: [
      "A store gets an address on `prood.app` when it is created. Its name can't be changed afterwards. The Customer may also connect its own domain, which it must control and keep paid. DNS changes at the Customer's registrar are the Customer's job. We may remove an address or domain that breaks these terms or the law, or that we can no longer serve.",
    ],
  },
  {
    title: "Personal data",
    id: "personal-data",
    body: [
      "For personal data about its shoppers, the Customer is the controller and we are its processor, under our [data processing terms](/dpa). For our own data about the Customer's team and for people who visit our sites and stores, we are the controller, as our [privacy notice](/privacy) explains.",
    ],
  },
  {
    title: "API, MCP and AI agents",
    id: "api",
    body: [
      "API keys belong to the organization that created them and must be kept secret. Requests are limited to 600 a minute per key, and AI agents share one limit of 600 a minute per store. Don't get around a limit.",
      "Agent Auth lets an AI agent act on a store only after a person with the right role approves it, and what it may do is what that person approved. The Customer is responsible for every agent it approves, as if its own member had acted. Some capabilities need a recent sign-in to approve, and the Customer must not weaken that check.",
      "The Admin API, Agent Auth and write access belong to paid plans and are refused on Free.",
    ],
  },
  {
    title: "Acceptable use",
    id: "acceptable-use",
    body: [
      "Don't use Prood to sell or publish anything illegal, counterfeit, or that infringes someone's rights; to deceive shoppers; to send spam; to break into other people's systems or data; to test the security of Prood or others without permission; to overload or harm the service or other stores; or to resell access to Prood without our agreement.",
      "To tell us about illegal content on a store hosted by Prood, write to [" + email + "](mailto:" + email + ") with the address of the page, why you think it is illegal and your name and email. That address is also our point of contact for authorities and for recipients of the service under Regulation (EU) 2022/2065 (the Digital Services Act). We read reports and may remove content or suspend a store, and we tell the Customer why unless the law forbids it.",
    ],
  },
  {
    title: "Suspension and termination",
    id: "termination",
    body: [
      "We may suspend or close a store, or an account, if it breaks these terms or the law, puts the service or others at risk, or if we are required to. Where we can, we give notice and a chance to fix the problem first, and we state the reason. We may end the contract for any other reason with at least 30 days' notice.",
      "The Customer may stop using Prood at any time and may close its account by email. It may end the contract without notice if we change these terms in a way it doesn't accept, or in the cases these documents give.",
      "If you disagree with a decision of ours, write to us. We answer within 14 days. We are willing to take a dispute to mediation, and will name the mediators here when we have agreed on them.",
    ],
  },
  {
    title: "Leaving, switching and your data",
    id: "switching",
    body: [
      "Under Regulation (EU) 2023/2854 (the Data Act) the Customer may switch to another provider, or to its own systems, or delete its data. Prood does not charge for this. This is how it works while self-service tools do not yet exist:",
      {
        list: [
          "**Notice.** Email us. We ask for no notice period. Closing is effective when you say so, and you pay nothing to leave.",
          "**What you can take.** Your products and categories, orders and order history, customers and their addresses, store settings and the images you uploaded. We give them as CSV or JSON files. On a paid plan the Admin API also returns them. We don't export payment provider credentials, which stay with you.",
          "**When.** We complete the export within 30 days of your request. If that isn't possible, we say so within 14 working days, with reasons and a date of up to seven months, and we keep the service running until then.",
          "**Retrieval.** After the contract ends, you have at least 30 days to ask for your data, unless you ask us to delete it at once.",
          "**Deletion.** Then we delete the Customer Data, unless the law requires us to keep it. Copies in the backups of our database provider are overwritten on its own schedule.",
          "**Addresses.** A `prood.app` address stops working when the store closes. A custom domain stays yours, and you point it elsewhere.",
        ],
      },
      "Where our infrastructure is and how we protect against unlawful government access is set out on the [sub-processors page](/subprocessors#jurisdiction).",
    ],
  },
  {
    title: "Intellectual property",
    id: "ip",
    body: [
      "Prood's software, design, name and logo belong to us or our licensors. During the contract we give the Customer a non-exclusive, non-transferable right to use Prood for its business. You may use what we publish on this site for your own reference and share it with attribution, but not copy substantial parts for commercial use without our written permission. We may use feedback freely, without using Customer Data.",
    ],
  },
  {
    title: "Subcontractors",
    id: "subcontractors",
    body: [
      "We use the subcontractors named on our [sub-processors page](/subprocessors). The [data processing terms](/dpa) describe how we add or replace them, and the Customer's right to object.",
    ],
  },
  {
    title: "Not advice",
    id: "no-advice",
    body: [
      "What we publish about law, tax, payments or e-commerce is general information. It is not legal, tax or accounting advice. Take professional advice for your own case. Links to other sites are for convenience, and we are not responsible for what is on them.",
    ],
  },
  {
    title: "Warranties",
    id: "warranties",
    body: [
      "Prood is in an early stage and its Free plan costs nothing. It is provided as it is. To the extent the law allows, we give no warranty that it is error-free, uninterrupted, or fit for a particular purpose, or that using it meets a legal requirement. We work to keep it running and secure, but promise no level of availability.",
    ],
  },
  {
    title: "Liability",
    id: "liability",
    body: [
      "Nothing in these terms excludes or limits liability for:",
      {
        list: [
          "wilful misconduct (dolo) or gross negligence (culpa grave), by us or by our representatives or auxiliaries;",
          "harm to life, moral or physical integrity, or health;",
          "anything else the law does not allow to be excluded or limited.",
        ],
      },
      "Subject to that, we are not liable under this contract for loss of profit, loss of sales or business, or indirect or consequential loss. Our total liability under the contract is limited to €100 for all claims arising in any 12-month period. If the Customer pays us fees, the limit is the higher of €100 and the fees it paid us in those 12 months.",
      "These limits also apply to the [data processing terms](/dpa), as their clause 13.1 explains. They do not affect the rights of data subjects under Article 82 of the GDPR.",
      "The Customer is responsible for claims by third parties, including shoppers and authorities, that arise from its store, its Customer Data or its breach of these terms, except to the extent that we caused them.",
    ],
  },
  {
    title: "Changes to these terms",
    id: "changes",
    body: [
      "We may change these terms for valid reasons, such as new features, new law, or security. We will email the Customer's owners at least 30 days before a material change applies, and show the new text. The email will say that using Prood after that date means accepting the change. If the Customer does not agree, it may end the contract without charge before the change applies, and the previous terms govern until it does. Changes do not apply to past events, and silence alone is never acceptance of fees.",
    ],
  },
  {
    title: "Notices",
    id: "notices",
    body: [
      `We send notices to the email addresses of the Customer's owners. The Customer sends notices to [${email}](mailto:${email}) or to our registered address.`,
    ],
  },
  {
    title: "General",
    id: "general",
    body: [
      "Neither party is liable for delay caused by events beyond its reasonable control. Neither party may transfer the contract without the other's consent, except that we may transfer it to a successor to the business and will tell the Customer, who may then end the contract without charge. If a clause is invalid, the rest stays in force. These documents are the whole agreement on their subject. They are written in English.",
    ],
  },
  {
    title: "Law and courts",
    id: "law",
    body: [
      "Portuguese law governs these terms and the contract. Disputes go exclusively to the courts of the Cascais judicial area (Comarca de Lisboa Oeste), unless mandatory rules on jurisdiction say otherwise.",
      "Complaints can go to us at the address above, and to the electronic complaints book at [livroreclamacoes.pt](https://www.livroreclamacoes.pt).",
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      summary={`The contract between you and ${legal.name} for using Prood. It also covers how to use this website. Last updated ${legal.updated}.`}
      sections={sections}
      related={[
        { label: "Privacy policy", href: "/privacy" },
        { label: "Data processing terms", href: "/dpa" },
        { label: "Sub-processors", href: "/subprocessors" },
        { label: "Legal notice", href: "/legal" },
      ]}
    />
  )
}
