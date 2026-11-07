import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.privacy)

const { legal, email } = siteConfig

const sections: readonly LegalSection[] = [
  {
    title: "Who is responsible for your data",
    id: "controller",
    body: [
      `**${legal.registeredName}** (“${legal.name}”, “Prood”, “we”), ${legal.address}, NIPC and VAT number ${legal.vat}, is the controller for the data described in this notice: visitors to prood.com and to stores hosted on prood.app, the accounts of people who use Prood, and the sign-in accounts of shoppers.`,
      `Contact for anything about privacy: [${email}](mailto:${email}). We have not appointed a data protection officer, because the conditions in Article 37 of the GDPR do not apply to our processing.`,
      "For the personal data of a store's shoppers, such as orders and delivery addresses, the store's owner decides what is processed and we act on its instructions. See [store shoppers](#shoppers).",
    ],
  },
  {
    title: "In short",
    id: "summary",
    body: {
      list: [
        "We collect what we need to run Prood, and we do not sell personal data.",
        "Our application and database are set up to run in Frankfurt. Some providers we rely on are in the United States, and [outside the EEA](#transfers) says which and why.",
        "We set only the cookies Prood needs to work, or that remember a choice you made. Visit statistics load only if you allow them, and set no cookie.",
        "We don't build profiles and make no decisions about you by automated means alone.",
        `You can exercise your rights by writing to [${email}](mailto:${email}).`,
      ],
    },
  },
  {
    title: "What we use, why, and for how long",
    id: "processing",
    body: [
      {
        table: {
          head: ["What happens", "Data", "Purpose and legal basis (GDPR)", "How long"],
          rows: [
            [
              "Visiting prood.com, a store or any Prood app",
              "IP address, browser details, address requested, time",
              "Delivering pages, preventing abuse, fixing faults. Legitimate interests, Art. 6(1)(f): a secure, working service",
              "Technical logs are kept by our hosting provider for a short period it sets, and we use them only to investigate faults and attacks",
            ],
            [
              "Visit statistics, only if you allow them",
              "Pages viewed, referring site, country, browser and device type. No cookie, no identifier, no IP address kept",
              "Knowing how the site is used, with Vercel Web Analytics. Consent, Art. 6(1)(a), and Art. 5 of Law 41/2004",
              "Kept as totals by Vercel. We don't see individual visitors",
            ],
            [
              "Your privacy choice",
              "Your choice, a random session ID, and the IP address, language and browser details of the request",
              "Showing the banner and proving what you chose, with INTH. Legitimate interests, Art. 6(1)(f), and our duty to show consent was given (Art. 7(1))",
              "The choice is kept in your browser for 12 months, and we ask again after that. The record is kept for as long as we may need to prove what you chose, which we review every year, and is deleted on request",
            ],
            [
              "Creating a Prood account",
              "Name, email address, password (stored as a hash), role, organization and team memberships, invitations (invitee's email, role, who invited them), and an authenticator-app secret and backup codes if you turn on two-factor (stored encrypted)",
              "Providing Prood and signing you in. Contract, Art. 6(1)(b), if the account is yours. Otherwise legitimate interests, Art. 6(1)(f): giving your organization the accounts it asked for",
              "While the account is open. You can delete it yourself under Profile in the dashboard, and it goes at once. An invitation is valid for 48 hours and is deleted 30 days after it expires",
            ],
            [
              "Keeping accounts secure",
              "IP address and browser details of each session, and request counts per IP address and per API key",
              "Showing sessions, stopping attacks and abuse. Legitimate interests, Art. 6(1)(f)",
              "A session lasts 7 days from last use, and expired sessions are deleted every day. Request counters last seconds to a minute",
            ],
            [
              "API keys and AI agents",
              "Key name, prefix and last use (the key itself is stored as a hash), agent name, what an agent did (type, capability, status, duration) but not the content it sent or received",
              "Running the API, showing activity and keeping stores safe. Contract, Art. 6(1)(b), and legitimate interests, Art. 6(1)(f)",
              "Agent activity is deleted after 24 months. The rest stays while the organization exists",
            ],
            [
              "Plans and billing",
              "The organization's name, the owner's email, billing address and tax number, plan and subscription dates. Card details stay with Stripe",
              "Charging for paid plans and issuing invoices. Contract, Art. 6(1)(b), and legal obligation, Art. 6(1)(c). Paid plans can't be bought yet, so this applies once they can",
              "Invoices and accounting records for 10 years, as Portuguese tax and accounting law requires",
            ],
            [
              "Linking your past guest orders to your account",
              "Your verified email address, and the references of orders placed with it as a guest in any store",
              "Showing you your orders in one place after you create an account and verify your email address. Contract, Art. 6(1)(b), at your request. We use the order references only for this",
              "While the account is open",
            ],
            [
              "Address suggestions at checkout",
              "The address text you type, and your IP address, sent from your browser to Geoapify",
              "Helping you fill in your address. This is done for the store you are buying from, which is the controller, under our data processing terms. It is listed here so you can see where your IP address goes",
              "Geoapify's own retention. We don't keep it",
            ],
            [
              "What Prood administrators do to accounts",
              "Who did it, what they did in the admin console (a ban, a role change, signing a device out, resetting two-factor, revoking an agent), to which account, when, and their IP address. Changes made by calling the sign-in API directly, and impersonation, are not recorded yet",
              "Accountability for staff access to accounts. Legitimate interests, Art. 6(1)(f)",
              "24 months",
            ],
            [
              "Service email",
              "Email address, name, message content",
              "Confirming addresses, resetting passwords, invitations and order emails. The same basis as the account or order",
              "Delivery logs are kept by our email provider for a limited time",
            ],
            [
              "Store sign-in accounts of shoppers",
              "Name, email address, password (as a hash), sessions with IP address and browser details",
              "Letting a shopper see their orders and check out faster. Contract, Art. 6(1)(b), with the shopper. Security of sessions: legitimate interests, Art. 6(1)(f)",
              "While the account is open. You can delete it yourself on your account page in the store, and it goes at once",
            ],
            [
              "Writing to us",
              `Your address, your message, anything you include`,
              "Answering you and handling requests. Legitimate interests, Art. 6(1)(f), or contract. Data-rights requests: legal obligation, Art. 6(1)(c)",
              "Up to 2 years. A record of each data-rights request is kept for 3 years, to show how it was handled",
            ],
          ],
        },
      },
      "**Your right to object.** Where we rely on legitimate interests, you can object at any time on grounds relating to your situation (Art. 21 GDPR). Email us and we will stop unless we have compelling legitimate grounds that override your interests, rights and freedoms, or need the data for legal claims.",
      "Backups held by our database provider are overwritten on its own schedule, so deleted data can remain there for a limited time.",
    ],
  },
  {
    title: "Store shoppers",
    id: "shoppers",
    body: [
      "Every store on Prood belongs to a business. When you buy from a store, the store's owner is the controller of your order, delivery address, contact details and any returns or reviews, and decides how they are used. Its own privacy notice applies and requests should go to it first. We process this data for the store under our [data processing terms](/dpa), and we don't use it for our own purposes.",
      "We are the controller of three things on a store:",
      {
        list: [
          "**Your sign-in account, if you create one.** One email address has one Prood account, which works on every store. Each store sees only its own orders, and no store can see your account or your orders on another. When you verify your email address, orders you placed as a guest with that address, in any store, are linked to your account so that you can see them.",
          "**Session security and rate limits**, as above.",
          "**Visit statistics and your privacy choice**, as above. They appear on stores as well as on prood.com.",
        ],
      },
      "On your account page in a store you can download the sign-in details we hold about you and delete your account. Deleting it removes your sign-in, your sessions and the link to your orders. The stores keep the orders you placed, because they need them for their own records, and a request about those goes to the store.",
      "At checkout, details you type are held for the order for 24 hours, or up to 7 days while a payment reference such as Multibanco is waiting to be paid. Address suggestions come from Geoapify, which receives the address text you type and your IP address. Card and bank details go to the payment provider the store has connected (Stripe, Easypay or Ifthenpay), and not to us. That provider is the store's own, with its own notice and terms, and receives your name, contact details and the amount.",
      "Stores don't send marketing email through Prood. Shopper emails from Prood are about an order or an account, such as confirmations, shipping and password resets. They come from Prood's sender address and carry the store's name.",
    ],
  },
  {
    title: "Data merchants put on Prood",
    id: "customer-data",
    body: [
      "Merchants use Prood to run a store. For the personal data of their shoppers, the merchant is the controller and we are its processor under our [data processing terms](/dpa). If you are a merchant's shopper, see [store shoppers](#shoppers). If a colleague invited you to a Prood organization, we received your email address, organization and role from them, and we are the controller for that invitation and for any account you create.",
    ],
  },
  {
    title: "Who receives your data",
    id: "recipients",
    body: [
      "We share data only with the providers below, and only as needed for the purposes above. They act on our instructions under data processing agreements. The current list is on the [sub-processors page](/subprocessors).",
      {
        table: {
          head: ["Recipient", "Role", "What they do", "What they receive"],
          rows: [
            ["Vercel Inc.", "Processor", "Hosting, delivery network, logs, visit statistics if allowed", "Everything passing through our sites"],
            ["Databricks, Inc. and Neon, LLC", "Processor", "Database, stored in Frankfurt", "All stored data"],
            ["Upstash", "Processor", "Checkout sessions and rate limits, Frankfurt", "Checkout details for 24 hours or up to 7 days, and IP addresses with request counts"],
            ["Cloudflare", "Processor", "Stores and serves public images, in the EU", "Images and their addresses"],
            ["Resend", "Processor", "Sends service email", "Email addresses, names, message content"],
            ["Geoapify", "Processor", "Address suggestions at checkout", "The address text you type, and your IP address"],
            ["INTH", "Processor", "Privacy banner and consent records, Frankfurt", "Your choice, session ID, IP address, language, browser details"],
            ["Stripe", "Independent controller (payment processing)", "Collects Prood's own plan fees, once paid plans exist", "The organization's name, owner's email, billing address, tax number"],
            ["A store's own payment provider (Stripe, Easypay, Ifthenpay)", "The store's own provider", "Takes the shopper's payment for the store", "Name, contact details, amount, and the payment details the shopper enters with them"],
          ],
        },
      },
      "We may disclose data to courts and authorities when the law requires it, and to professional advisers bound by confidentiality. If we sell or reorganize the business, the acquirer takes on the commitments in this notice.",
    ],
  },
  {
    title: "Data outside the European Economic Area",
    id: "transfers",
    body: [
      "Our application runs in Frankfurt, and our database, checkout sessions and consent records are stored there too. Even so, some data leaves the EEA:",
      {
        list: [
          "Vercel's network delivers pages from the location nearest you, worldwide, and Vercel may process logs in the United States.",
          "Databricks and Neon, Upstash, Cloudflare and Resend are US companies. Their staff outside the EEA may have access for support and security, and Resend stores message data and logs in the United States.",
          "Stripe, Easypay and Ifthenpay process payments under their own terms and locations.",
        ],
      },
      "These transfers rely on the EU–US Data Privacy Framework (Commission Decision (EU) 2023/1795) where the provider is certified, and otherwise on the Standard Contractual Clauses of Commission Decision (EU) 2021/914. The [sub-processors page](/subprocessors) says which applies to each. Write to us for a copy of the clauses.",
    ],
  },
  {
    title: "Cookies and similar storage",
    id: "cookies",
    body: [
      "Prood sets the cookies it needs to work, or that remember a choice you made. These need no consent under Art. 5 of Portuguese Law 41/2004. The only thing that does need it, visit statistics, is off until you allow it in the banner shown on your first visit. You can change your choice at any time with **Cookie settings** in the footer of prood.com and of every store. We don't use advertising cookies.",
      {
        table: {
          head: ["Name", "Where", "Purpose", "Lasts"],
          rows: [
            [
              "`__Secure-better-auth.session_token`",
              "When you sign in to the dashboard, admin console or API. It can also be sent to other prood.com sites, and is set on a store if a shopper signs in",
              "Keeps you signed in",
              "7 days from last use",
            ],
            ["`better-auth.two_factor`", "Dashboard and admin, during the second sign-in step", "Holds your sign-in between your password and your code", "10 minutes"],
            ["`better-auth.trust_device`", "Dashboard only, and only if you tick “Trust this device”", "Skips the code on this browser", "30 days"],
            ["`commerce_cart_id`", "Stores", "Keeps your cart", "30 days"],
            ["`sidebar_state`", "Dashboard and admin", "Remembers whether the side menu is open, because you chose it", "7 days"],
            ["`c15t`", "prood.com and stores", "Remembers your privacy choice", "12 months"],
          ],
        },
      },
      "Your browser's own storage holds a few more things that never reach our servers by themselves: `theme` (light or dark), `saved-for-later` (items you set aside in a store) and `prood-checkout` (details you typed during checkout, cleared when the tab closes), plus a few `c15t` entries for your privacy choice. They hold what you chose or typed, to make the site work as you left it.",
      "When a store uses Stripe, Stripe's checkout may set its own cookies for fraud prevention, under Stripe's own notice. Vercel Web Analytics sets no cookie.",
    ],
  },
  {
    title: "Your rights",
    id: "rights",
    body: [
      "You can ask us for access to your data and a copy of it, to correct, delete or restrict it, or to receive it in a portable form. You can object to processing, and you can withdraw consent at any time, which does not affect earlier processing.",
      "Most of this you can do yourself. In the dashboard, **Profile → Your data** downloads a copy of your account and deletes it, and **Store settings** downloads a store's data and deletes the store. Shoppers do the same on their account page in a store. A store's owner or admin can erase a single shopper from the customer's page in the dashboard. A review written under a shopper's name stays until the store removes it. Deleting an account removes your name, email address, sign-in methods, sessions and memberships at once. Activity records that carry only an internal account number, such as what an AI agent did or what an administrator did to the account, stay for 24 months. If you are the only owner of a store, you delete the store or add another owner first. Backups held by our database provider age out on its own schedule.",
      `For anything else, write to [${email}](mailto:${email}). We reply within one month, may ask you to confirm your identity, and charge nothing unless a request is manifestly unfounded or excessive. If your data is in a store's orders, we pass your request to the store, which is its controller, and help it answer.`,
      "You may complain to the Portuguese supervisory authority, the [Comissão Nacional de Proteção de Dados](https://www.cnpd.pt), or to the authority where you live or work.",
    ],
  },
  {
    title: "Other things you should know",
    id: "other",
    body: [
      "You don't have to give us any data to read this website. To create an account we need your name and email address, and without them we can't create it. Prood is for businesses. Stores sell to the public, and a store's own notice governs what it does with the data of children.",
      "We make no decisions about you by automated means alone, and we do not build profiles.",
    ],
  },
  {
    title: "Changes",
    id: "changes",
    body: [
      "If we change this notice in a way that matters, we will update the date at the top of this page, and email account holders before the change applies. Earlier versions are available on request.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      summary={`How ${legal.name} handles personal data for Prood, written to meet Articles 13 and 14 of the GDPR. Last updated ${legal.updated}.`}
      sections={sections}
      related={[
        { label: "Terms of service", href: "/terms" },
        { label: "Data processing terms", href: "/dpa" },
        { label: "Sub-processors", href: "/subprocessors" },
        { label: "Legal notice", href: "/legal" },
      ]}
    />
  )
}
