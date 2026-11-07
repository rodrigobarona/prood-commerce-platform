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
      `This agreement (“DPA”) forms part of the contract between the organization using Prood (the “Customer”) and **${legal.registeredName}**, ${legal.address} (“Prood”). It meets the requirements of Article 28 of Regulation (EU) 2016/679 (GDPR). Terms defined in the GDPR have the same meaning here. “Customer Data” means the content and data the Customer puts into Prood or collects through its store, including its shoppers' personal data. The Customer accepts this DPA with the [terms of service](/terms) when its account is created, by ticking the box on the sign-up form that links to both. We record which version was accepted and when. No signature is needed. To receive a countersigned copy, write to [${email}](mailto:${email}).`,
      "1.1 For personal data in Customer Data, the Customer is the controller, or a processor for another controller, and Prood is the processor, or a sub-processor. The Customer confirms that any controller it acts for has authorized this DPA.",
      "1.2 Annex 1 describes the subject matter, duration, nature and purpose of the processing, the types of personal data and the categories of data subjects.",
      "1.3 Prood is a separate controller for the data its [privacy policy](/privacy) describes as its own: visitors to its sites and stores, the accounts of people who use Prood, the sign-in accounts of shoppers, and billing. This DPA does not cover that data.",
    ],
  },
  {
    title: "Instructions",
    id: "instructions",
    body: [
      "2.1 Prood processes personal data only on the Customer's documented instructions, including for transfers. Those instructions are this DPA, the terms of service, the Customer's use of the dashboard, API, MCP server and approved agents, and any further written instruction both parties agree. The Customer also instructs Prood to link orders placed as a guest with an email address to the shopper account that holds that verified address, so the shopper can see them. Prood is the controller of that link (see clause 1.3).",
      "2.2 If Union or Member State law requires other processing, Prood will tell the Customer first, unless that law forbids it.",
      "2.3 Prood will tell the Customer at once if it believes an instruction infringes data protection law, and may pause that instruction until the Customer confirms or changes it.",
      "2.4 Prood does not sell Customer Data and does not use it for its own purposes, except for the link described in clause 2.1.",
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
      "6.4 Prood binds each sub-processor to the same data protection obligations as this DPA, as Article 28(4) GDPR requires, and stays fully liable to the Customer for the sub-processor's performance, as clause 13.1 explains.",
      "6.5 Sub-processors use their own sub-processors, under their own published lists, which the sub-processors page links.",
    ],
  },
  {
    title: "Transfers outside the EEA",
    id: "transfers",
    body: [
      "7.1 Prood transfers personal data outside the European Economic Area only on the Customer's instructions and under Chapter V GDPR. Annex 3 identifies the transfers and their safeguards. By accepting this DPA, the Customer instructs Prood to make those transfers.",
      "7.2 Where a transfer relies on the Standard Contractual Clauses (Commission Decision (EU) 2021/914), Prood relies on the clauses included in the sub-processor's data processing terms, which cover the transfer from processor to sub-processor. Prood will give a copy on request, with commercial terms removed.",
      "7.3 If a safeguard stops being valid, the parties will rely on another lawful safeguard. If none is available, Prood will tell the Customer, and the Customer may end the contract without charge.",
      "7.4 If Prood receives a request from a public authority for personal data, it will refer the authority to the Customer where it can, tell the Customer unless the law forbids it, and disclose only what the law requires.",
    ],
  },
  {
    title: "Helping with data subject requests",
    id: "requests",
    body: [
      "8.1 If Prood receives a request from a data subject about Customer Data, it will pass the request to the Customer without undue delay and will not answer it, except to refer the person to the Customer.",
      `8.2 Prood helps the Customer respond. Store settings downloads all of a store's data as one JSON file on every plan, the dashboard lists and edits customers and orders, and an owner or admin can erase one shopper from a customer's page: the profile, saved addresses, wishlist and open carts go, and the orders stay in the store's records without a link to the shopper, or with the shopper's email, addresses and notes cleared from them too if the Customer chooses. For anything those tools can't reach, the Customer can ask Prood by email to [${email}](mailto:${email}) to find, export, correct or delete a shopper's data, and Prood will do it within 30 days.`,
    ],
  },
  {
    title: "Personal data breaches",
    id: "breach",
    body: [
      "9.1 Prood will notify the Customer's owners by email without undue delay after becoming aware of a personal data breach affecting Customer Data, and aims to do so within 48 hours.",
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
      "11.1 During the contract the Customer can download a store's data as one JSON file (without payment provider credentials and image files, which Prood removes on request) and delete products, categories and API keys, and revoke agents, itself. An owner can also delete the whole store, which removes everything the store owns in Prood's database at once. Checkout sessions expire within the periods in Annex 1. A store with a live paid plan must cancel the plan first.",
      "11.2 When the contract ends, the retrieval period in the terms of service applies, and at the Customer's choice Prood returns the Customer Data or deletes it. Within 30 days after that period Prood deletes the Customer Data, unless Union or Member State law requires it to keep the data. Copies in the backups of Prood's database provider are overwritten on its own schedule.",
      "11.3 Prood deletes the records listed in Annex 1 when their retention period ends.",
    ],
  },
  {
    title: "Audits and information",
    id: "audits",
    body: [
      "12.1 Prood makes available all information needed to demonstrate compliance with Article 28 GDPR, and answers reasonable written questions within 30 days.",
      "12.2 If the information under clause 12.1 does not suffice to demonstrate compliance, Prood allows and contributes to audits, including inspections, by the Customer or an auditor it mandates who is bound by confidentiality. The Customer will give 30 days' notice, except after a personal data breach or where a supervisory authority requires otherwise, and will avoid unreasonable disruption and exposure of other customers' data.",
      "12.3 Audits do not extend to the premises or systems of sub-processors beyond what their terms allow. Their published certifications and reports are the primary evidence.",
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
          "Carts, saved addresses, wishlists, and reviews with the author's name (reviews are not linked to the shopper's profile)",
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
      "**Location and hosting.** Application functions, the database and checkout sessions are set up to run in the Frankfurt region, and public images are stored in the EU, as the providers state and as Prood last checked on 2 November 2026. Pages are delivered through a global network, as Annex 3 describes.",
      "**Encryption.** Traffic uses HTTPS. The database provider encrypts data at rest. Payment provider credentials are additionally encrypted with AES-256-GCM when they are saved.",
      "**Separation of stores.** Store data is read and written through a database role that row-level security limits to one store at a time, and that cannot read the sign-in tables except for account identifiers and email addresses. A few operations that cross stores, such as linking a verified shopper's past orders to their account, run under the connecting role, in code that is written to touch only that shopper's rows.",
      "**Secrets.** Passwords are stored as scrypt hashes. API keys are stored as hashes and shown once. Payment confirmations are verified with the store's own credentials: Stripe's signature, Ifthenpay's key, and for Easypay by reading the payment again from Easypay. Internal tokens are compared in constant time.",
      "**Retention.** A daily job deletes expired sessions and verification links, team invitations 30 days after they expire, and agent activity records after 24 months.",
      "**Two-factor.** Merchants and administrators can turn on two-factor sign-in with an authenticator app and one-time backup codes. It is optional, and an account that has it can only sign in from the dashboard, never from a store. An administrator who has turned it on is asked for the code when signing in to the admin console, and the admin console ignores a browser trusted at the dashboard. Two-factor is not yet required for administrators, and when sign-in cookies are shared across prood.com sites, a session started at the dashboard can be used at the admin console. If someone loses both their phone and their backup codes, an administrator resets it after checking who is asking, and the reset is recorded in the audit log.",
      "**Access control.** Three organization roles: owner, admin and member. Only owners and admins may use admin-level API keys and approve agents' admin capabilities, and only an owner changes the plan. Sessions last 7 days, are refreshed on use, and are cleared when a password is reset. Agent Auth agents start with public catalog reads only, and anything else needs a person's approval. Approving capabilities that change a store needs a sign-in from the last 10 minutes.",
      "**Application security.** Rate limits on sign-in and on the API (600 requests a minute per key; if the limiter is unavailable, requests are let through), session cookies that are HTTP-only, SameSite=Lax and Secure in production, email verification for store accounts that claim past orders, validated input on API routes, and security headers on every app: HTTP Strict Transport Security, a Content-Security-Policy that limits which origins may load scripts, frames and connections (it still allows inline scripts, so it is not a full defence against injected script), and controls on framing, content type and referrers.",
      "**Logging.** Agent activity is recorded with its type, capability, status and duration, not with the content it handled. What Prood administrators do to accounts in the admin console (a ban, a role change, signing a device out, resetting two-factor, revoking an agent) is recorded with who did it, to whom, when and from which IP address, and kept for 24 months. Reads of data, changes made by calling the sign-in API directly, and impersonation are not recorded yet.",
      "**Availability.** The database provider offers point-in-time restore. Prood promises no recovery time. Hosting includes platform DDoS mitigation.",
      "**Staff.** Access to production systems is limited to the people who need it, who are bound by confidentiality. Platform administrators can see accounts and sessions across stores, which is why it is limited.",
      "**Limits.** Prood holds no ISO 27001 or SOC 2 certification, has not yet commissioned an external penetration test, and offers passkeys only where they are enabled (see the security page). Its hosting and database providers hold their own certifications, listed on the [sub-processors page](/subprocessors).",
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
