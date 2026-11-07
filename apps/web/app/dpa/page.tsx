import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.dpa)

const { legal, email } = siteConfig

const sections: readonly LegalSection[] = [
  {
    title: "Roles and scope",
    id: "roles",
    body: [
      `This agreement (“DPA”) forms part of the contract between the organization using Prood (the “Customer”) and **${legal.registeredName}**, ${legal.address} (“Prood”). It meets the requirements of Article 28 of Regulation (EU) 2016/679 (GDPR). Terms defined in the GDPR have the same meaning here. The Customer accepts this DPA with the [terms of service](/terms). No signature is needed. To receive a countersigned copy, write to [${email}](mailto:${email}).`,
      "1.1 For personal data in Customer Data, the Customer is the controller, or a processor for another controller, and Prood is the processor, or a sub-processor. The Customer confirms that any controller it acts for has authorized this DPA.",
      "1.2 Annex 1 describes the subject matter, duration, nature and purpose of the processing, the types of personal data and the categories of data subjects.",
      "1.3 Prood is a separate controller for the data its [privacy policy](/privacy) describes as its own: visitors to its sites and stores, the accounts of people who use Prood, the sign-in accounts of shoppers, and billing. This DPA does not cover that data.",
    ],
  },
  {
    title: "Instructions",
    id: "instructions",
    body: [
      "2.1 Prood processes personal data only on the Customer's documented instructions, including for transfers. Those instructions are this DPA, the terms of service, the Customer's use of the dashboard, API, MCP server and approved agents, and any further written instruction both parties agree.",
      "2.2 If Union or Member State law requires other processing, Prood will tell the Customer first, unless that law forbids it.",
      "2.3 Prood will tell the Customer at once if it believes an instruction infringes data protection law, and may pause that instruction until the Customer confirms or changes it.",
      "2.4 Prood does not sell Customer Data and does not use it for its own purposes.",
    ],
  },
  {
    title: "The Customer's responsibilities",
    id: "customer",
    body: [
      "The Customer is responsible for having a lawful basis for its processing, for informing its shoppers (including by publishing its own privacy notice), for the accuracy of the data, and for what it publishes. Prood does not yet give stores a place for their privacy notice, so the Customer places it itself. The Customer must not enter special categories of personal data or data about criminal convictions into Prood.",
      "The payment providers the Customer connects (Stripe, Easypay and Ifthenpay) are its own providers, under its own contract with each. When the Customer connects one, it instructs Prood to pass the data a payment needs to that provider. Prood is not responsible for what the provider does with it.",
    ],
  },
  {
    title: "Confidentiality",
    id: "confidentiality",
    body: ["Prood ensures that everyone authorized to process personal data is bound by confidentiality, by contract or by law."],
  },
  {
    title: "Security",
    id: "security",
    body: [
      "5.1 Prood maintains the technical and organizational measures in Annex 2, as Article 32 GDPR requires.",
      "5.2 Prood may update those measures if the level of protection does not fall.",
      "5.3 The Customer is responsible for the measures in its control, including managing members, roles, API keys and approved agents, and for keeping its payment provider credentials safe at the provider.",
    ],
  },
  {
    title: "Sub-processors",
    id: "subprocessors",
    body: [
      "6.1 The Customer gives general authorization for Prood to use sub-processors. Those in use on the date of acceptance are listed in Annex 3 and on the [sub-processors page](/subprocessors).",
      "6.2 Prood will give the Customer's owners at least 30 days' notice by email before adding or replacing a sub-processor. The email names the sub-processor and says that the Customer agrees unless it objects in time. A shorter period applies only where security or continuity needs it, and Prood then tells the Customer as soon as it can.",
      "6.3 The Customer may object on any reasonable ground within 14 days of the notice. The parties will then try to resolve the objection, and Prood will not use the new sub-processor for that Customer's data until they do or the contract ends. If it is not resolved, the Customer may end the contract without charge, and Prood may end it under the terms of service.",
      "6.4 Prood binds each sub-processor by contract to data protection obligations in substance no less protective than those in this DPA, and stays fully liable to the Customer for the sub-processor's performance, as clause 13.1 explains.",
      "6.5 Sub-processors use their own sub-processors, under their own published lists, which the sub-processors page links.",
    ],
  },
  {
    title: "Transfers outside the EEA",
    id: "transfers",
    body: [
      "7.1 Prood transfers personal data outside the European Economic Area only on the Customer's instructions and under Chapter V GDPR. Annex 3 identifies the transfers and their safeguards. By accepting this DPA, the Customer instructs Prood to make those transfers.",
      "7.2 Where a transfer relies on the Standard Contractual Clauses (Commission Decision (EU) 2021/914), Prood has entered into Module Three with the sub-processor through that sub-processor's data processing terms. Prood will give a copy on request, with commercial terms removed.",
      "7.3 If a safeguard stops being valid, the parties will rely on another lawful safeguard. If none is available, Prood will tell the Customer, and the Customer may end the contract without charge.",
      "7.4 If the Customer is established outside the EEA, Module Four of the same clauses applies between the parties, and Portuguese law and courts are chosen for that module.",
      "7.5 If Prood receives a request from a public authority for personal data, it will refer the authority to the Customer where it can, tell the Customer unless the law forbids it, and disclose only what the law requires.",
    ],
  },
  {
    title: "Helping with data subject requests",
    id: "requests",
    body: [
      "8.1 If Prood receives a request from a data subject about Customer Data, it will pass the request to the Customer without undue delay and will not answer it, except to refer the person to the Customer.",
      `8.2 Prood helps the Customer respond. Self-service export and deletion tools are not built yet, so the Customer can ask Prood to find, export, correct or delete a shopper's data by email to [${email}](mailto:${email}), and Prood will do it within 30 days. Where the Customer's plan includes it, the Admin API also reads this data.`,
    ],
  },
  {
    title: "Personal data breaches",
    id: "breach",
    body: [
      "9.1 Prood will notify the Customer's owners by email without undue delay, and in any case within 48 hours of becoming aware of a personal data breach affecting Customer Data.",
      "9.2 The notice will state, as far as is known, the nature of the breach, the categories and approximate number of data subjects and records, the likely consequences, the measures taken or proposed, and a contact point. Further information may follow in phases.",
      "9.3 Prood will take reasonable steps to contain and remedy the breach, and keep a record of it. Notifying a breach is not an admission of fault.",
    ],
  },
  {
    title: "Helping with compliance",
    id: "assistance",
    body: [
      "Taking into account the nature of the processing and the information available to it, Prood will reasonably assist the Customer with security, breach notification, data protection impact assessments and prior consultation (Articles 32 to 36 GDPR).",
    ],
  },
  {
    title: "Deleting or returning data",
    id: "deletion",
    body: [
      "11.1 During the contract the Customer can delete products, categories, API keys and agents itself. For the rest, such as orders and customers, it asks Prood as clause 8.2 describes.",
      "11.2 When the contract ends, the retrieval period in the terms of service applies. Prood then deletes Customer Data, unless Union or Member State law requires it to keep the data. Copies in the backups of Prood's database provider are overwritten on its own schedule.",
      "11.3 Prood deletes the records listed in Annex 1 when their retention period ends.",
    ],
  },
  {
    title: "Audits and information",
    id: "audits",
    body: [
      "12.1 Prood makes available all information needed to demonstrate compliance with Article 28 GDPR, and answers reasonable written questions within 30 days.",
      "12.2 Prood allows and contributes to audits, including inspections, by the Customer or an auditor it mandates who is bound by confidentiality. The Customer will give 30 days' notice, except after a personal data breach or where a supervisory authority requires otherwise, and will avoid unreasonable disruption and exposure of other customers' data.",
      "12.3 Where the information under 12.1 is not enough to demonstrate compliance, an audit may take place. Audits do not extend to the premises or systems of sub-processors beyond what their terms allow. Their published certifications and reports are the primary evidence.",
      "12.4 Each party bears its own audit costs.",
    ],
  },
  {
    title: "Liability, duration and precedence",
    id: "general",
    body: [
      "13.1 Liability between the parties under this DPA, including for a sub-processor's performance (clause 6.4) and for recourse under Article 82(5) GDPR, follows the section on liability in the terms of service, with the exceptions listed there, and as far as the law allows. Nothing here limits either party's liability to data subjects or supervisory authorities.",
      "13.2 This DPA lasts as long as Prood processes Customer Data.",
      "13.3 This DPA prevails over the terms of service on data protection. The Standard Contractual Clauses, where they apply, prevail over both.",
      "13.4 Prood may change this DPA as the terms of service provide, or where the law or a supervisory authority requires it. Changes cannot reduce the Customer's protection without its agreement.",
      "13.5 Portuguese law governs this DPA, and the courts named in the terms of service have jurisdiction.",
    ],
  },
  {
    title: "Annex 1: Description of the processing",
    id: "annex-1",
    annex: true,
    body: [
      "**Subject matter.** Hosting a store, taking and managing its orders, running checkout, sending order emails, and providing the dashboard, API and MCP server.",
      "**Duration.** The term of the contract and the retrieval period, and then until backups are overwritten.",
      "**Nature and purpose.** Storing, organizing, retrieving, transmitting, displaying and deleting Customer Data, in order to provide the service.",
      "**Categories of data subjects.** The Customer's shoppers and prospective shoppers, including guests who check out without an account, and people the Customer enters as contacts, such as reviewers.",
      "**Types of personal data.**",
      {
        list: [
          "Names, email addresses, phone numbers, delivery and billing addresses",
          "Orders and their history, payment references (for example a Multibanco reference), tracking numbers, returns and notes",
          "Carts, saved addresses, wishlists, and reviews with the author's name",
          "Store account sign-in details. Passwords are stored as hashes. The account itself is Prood's own data and is not covered by this DPA, see clause 1.3",
          "IP address and browser details of checkout and API requests, held briefly for rate limits",
        ],
      },
      "**Special categories.** None. Clause 3 forbids them.",
      "**Frequency.** Continuous.",
      "**Retention.**",
      {
        table: {
          head: ["Data", "Period"],
          rows: [
            ["Customer Data", "Until the Customer deletes it or the contract ends, then the retrieval period"],
            ["Checkout sessions", "24 hours, or up to 7 days while a payment reference such as Multibanco is waiting to be paid"],
            ["Rate-limit counters", "Seconds to a minute"],
            ["Backups at the database provider", "Overwritten on the provider's own schedule"],
          ],
        },
      },
    ],
  },
  {
    title: "Annex 2: Technical and organizational measures",
    id: "annex-2",
    annex: true,
    body: [
      "**Location and hosting.** Application functions run in the Frankfurt region. The database, checkout sessions and public images are stored in the EU. Pages are delivered through a global network, as Annex 3 describes.",
      "**Encryption.** Traffic uses HTTPS. The database provider encrypts data at rest. Payment provider credentials are additionally encrypted in the database with AES-256-GCM.",
      "**Separation of stores.** Each store's data is kept apart in the database by row-level security, using an application database role that cannot read the sign-in tables.",
      "**Secrets.** Passwords are stored as scrypt hashes. API keys are stored as hashes and shown once. Webhooks from payment providers are verified against the store's own secret, and internal tokens are compared in constant time.",
      "**Access control.** Three organization roles: owner, admin and member. Only owners and admins may use admin-level API keys and approve agents' admin capabilities, and only an owner changes the plan. Sessions last 7 days, are refreshed on use, and are cleared when a password is reset. Agent Auth agents start with public catalog reads only, and anything else needs a person's approval. Approving capabilities that change a store needs a sign-in from the last 10 minutes.",
      "**Application security.** Rate limits on sign-in and on the API (600 requests a minute per key), session cookies that are HTTP-only, SameSite=Lax and Secure in production, email verification for store accounts that claim past orders, and validated input on API routes.",
      "**Logging.** Agent activity is recorded with its type, capability, status and duration, never with the data it handled. There is no complete administrator audit log yet.",
      "**Availability.** The database provider offers point-in-time restore. Prood promises no recovery time. Hosting includes platform DDoS mitigation.",
      "**Staff.** Access to production systems is limited to the people who need it, who are bound by confidentiality. Platform administrators can see accounts and sessions across stores, which is why it is limited.",
      "**Limits.** Prood holds no ISO 27001 or SOC 2 certification, has not yet commissioned an external penetration test, and does not yet offer two-factor authentication or passkeys. Its hosting and database providers hold their own certifications, listed on the [sub-processors page](/subprocessors).",
    ],
  },
  {
    title: "Annex 3: Sub-processors and transfers",
    id: "annex-3",
    annex: true,
    body: [
      {
        table: {
          head: ["Sub-processor", "Service", "Data location", "Transfer safeguard"],
          rows: [
            [
              "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA, USA",
              "Hosting, delivery network, firewall, logs",
              "Functions in Frankfurt. Global delivery network. Logs may be processed in the USA",
              "Data Privacy Framework and Standard Contractual Clauses",
            ],
            ["Databricks, Inc. and Neon, LLC, USA", "Database", "Frankfurt (AWS eu-central-1)", "Standard Contractual Clauses"],
            ["Upstash, Inc., USA", "Checkout sessions and rate limits", "Frankfurt", "Standard Contractual Clauses"],
            [
              "Cloudflare, Inc., 101 Townsend St, San Francisco, CA, USA",
              "Public image storage and delivery",
              "Stored in the EU. Delivered from a global network",
              "Data Privacy Framework and Standard Contractual Clauses",
            ],
            [
              "Plus Five Five, Inc. (Resend), San Francisco, CA, USA",
              "Order and service email",
              "Message data and logs stored in the USA",
              "Standard Contractual Clauses",
            ],
            ["Geoapify (Keptagon s.r.o.), Czech Republic", "Address suggestions at checkout", "European Union", "None needed"],
          ],
        },
      },
      "The payment provider the Customer connects is its own, not Prood's sub-processor. The current list, and links to each sub-processor's own list, are on the [sub-processors page](/subprocessors).",
    ],
  },
]

export default function DpaPage() {
  return (
    <LegalPage
      title="Data processing terms"
      summary={`Under Article 28 of the GDPR, between you as controller and ${legal.name} as processor. Last updated ${legal.updated}.`}
      sections={sections}
      related={[
        { label: "Terms of service", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Sub-processors", href: "/subprocessors" },
      ]}
    />
  )
}
