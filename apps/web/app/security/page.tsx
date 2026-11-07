import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.security)

const { legal, email } = siteConfig

const sections: readonly LegalSection[] = [
  {
    title: "Report a vulnerability",
    id: "report",
    body: [
      `If you find a security problem in Prood, write to [${email}](mailto:${email}) with “Security” in the subject. Tell us what you found, where, and how to reproduce it. Please don't include other people's personal data beyond what proves the problem. Our contact details are also in [security.txt](/.well-known/security.txt).`,
      "We aim to confirm that we got your report within 5 working days, tell you what we decide, and fix real problems as fast as we can. We won't take legal action against research that follows these rules. We can't speak for third-party services we use.",
      {
        list: [
          "test only prood.com, the Prood apps (dashboard, API, checkout, docs, admin) and stores on `prood.app`, with accounts and stores you created;",
          "don't read, change or delete other people's data, and stop as soon as you can show the problem;",
          "out of scope: the services of our providers, other merchants' stores and their own sites, social engineering, physical attacks, spam, and anything that overloads the service (denial of service);",
          "give us reasonable time to fix a problem before you publish it. We ask for 90 days.",
        ],
      },
      "We don't run a bug bounty and can't pay for reports. We are happy to credit you if you want.",
    ],
  },
  {
    title: "Where your data lives",
    id: "location",
    body: [
      "Prood's application functions, database, checkout sessions and consent records are set up to run in Frankfurt, and public images are stored in the EU. Pages are delivered through a global network. The [sub-processors page](/subprocessors) lists every provider, where it processes data and under which safeguards.",
    ],
  },
  {
    title: "How data is protected",
    id: "protection",
    body: {
      list: [
        "**In transit.** Every app is served over HTTPS with HTTP Strict Transport Security.",
        "**In the browser.** Every app sends a Content-Security-Policy that limits which origins may load scripts, frames and connections, and headers that stop framing, content-type guessing and referrer leaks. The policy still allows inline scripts, so it is not a full defence against injected script.",
        "**At rest.** Our database provider encrypts stored data. Payment provider credentials are also encrypted with AES-256-GCM when they are saved.",
        "**Passwords and keys.** Passwords are stored as scrypt hashes. API keys are stored as hashes and shown once. Authenticator-app secrets and backup codes are stored encrypted.",
        "**Stores kept apart.** Store data is read and written through a database role that row-level security limits to one store at a time. A few operations that cross stores run under a broader role, in code written to touch only the rows concerned.",
        "**Cookies.** Sign-in cookies are HTTP-only, SameSite=Lax and Secure in production.",
        "**Payments.** Card and bank details do not pass through Prood's servers: they go to the store's payment provider. Payment confirmations are verified with the store's own credentials: Stripe's signature, Ifthenpay's key, and for Easypay by reading the payment again from Easypay.",
        "**Retention.** A daily job deletes expired sessions and verification links, expired team invitations and old agent and administrator activity records, and account and store deletion are self-service. See the [privacy policy](/privacy).",
      ],
    },
  },
  {
    title: "Access and accounts",
    id: "access",
    body: {
      list: [
        "Stores have three roles: owner, admin and member. Only owners and admins can use admin-level API keys, change the store and approve agents, and only an owner changes the plan or deletes the store.",
        "Merchants and administrators can turn on two-factor sign-in with an authenticator app, under Profile in the dashboard. It comes with ten one-time backup codes. If you lose both your phone and your codes, write to us and we reset it after checking it is you. Accounts with two-factor on can only sign in from the dashboard, never from a store.",
        "An administrator who has turned on two-factor is asked for the code when signing in to Prood's admin console, which ignores a browser trusted at the dashboard. Two-factor is not yet required for administrators.",
        "Passkeys are built, and are switched on once Prood's apps run on prood.com addresses, because browsers tie a passkey to a domain we don't control on the current hosting addresses. A passkey signs you in without a password and counts as a second step.",
        "Sessions last 7 days from last use. Resetting a password signs every other session out.",
        "Sign-in, the API and agents are rate limited. If the limiter is unavailable, requests are let through.",
        "AI agents start with public catalog reads only. Anything more needs a person's approval in the dashboard, and approving changes to a store needs a sign-in from the last 10 minutes.",
        "Access to production systems is limited to the people who need it.",
      ],
    },
  },
  {
    title: "What we don't have yet",
    id: "gaps",
    body: [
      "We would rather tell you than leave you to assume:",
      {
        list: [
          "no ISO 27001 or SOC 2 certification, and no external penetration test yet. Our hosting and database providers hold their own certifications, listed on the [sub-processors page](/subprocessors);",
          "no log of what Prood administrators read. What they change on accounts in the admin console is recorded and kept for 24 months. Changes made by calling the sign-in API directly, and impersonation, are not recorded yet;",
          "no promised recovery time. Our database provider offers point-in-time restore.",
        ],
      },
    ],
  },
  {
    title: "Incidents",
    id: "incidents",
    body: [
      `If a personal data breach affects a store's data, we tell its owners by email without undue delay, and aim to do so within 48 hours of becoming aware of it, as the [data processing terms](/dpa) say. ${legal.name} reports breaches to the Portuguese data protection authority where the law requires.`,
    ],
  },
]

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      summary={`How Prood protects data, what it doesn't do yet, and how to report a problem. Last updated ${legal.updated}.`}
      sections={sections}
      related={[
        { label: "Privacy policy", href: "/privacy" },
        { label: "Data processing terms", href: "/dpa" },
        { label: "Sub-processors", href: "/subprocessors" },
      ]}
    />
  )
}
