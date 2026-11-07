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
      "We read every report, tell you what we decide, and fix real problems as fast as we can. We will not take legal action against research done in good faith that stays within these limits:",
      {
        list: [
          "test only prood.com, the Prood apps (dashboard, API, checkout, docs, admin) and stores on `prood.app`, with accounts and stores you created;",
          "don't read, change or delete other people's data, and stop as soon as you can show the problem;",
          "no denial-of-service tests, spam, social engineering or physical attacks;",
          "give us reasonable time to fix a problem before you publish it.",
        ],
      },
      "We don't run a bug bounty and can't pay for reports. We are happy to credit you if you want.",
    ],
  },
  {
    title: "Where your data lives",
    id: "location",
    body: [
      "Prood's application functions run in Frankfurt, and its database, checkout sessions and consent records are stored there too. Public images are stored in the EU. Pages are delivered through a global network. The [sub-processors page](/subprocessors) lists every provider, where it processes data and under which safeguards.",
    ],
  },
  {
    title: "How data is protected",
    id: "protection",
    body: {
      list: [
        "**In transit.** Every app is served over HTTPS with HTTP Strict Transport Security.",
        "**In the browser.** Every app sends a Content-Security-Policy that lists what may run and what may be contacted, and headers that stop framing, content-type guessing and referrer leaks.",
        "**At rest.** Our database provider encrypts stored data. Payment provider credentials are also encrypted with AES-256-GCM when they are saved.",
        "**Passwords and keys.** Passwords are stored as scrypt hashes. API keys are stored as hashes and shown once.",
        "**Stores kept apart.** Each store's data is separated in the database by row-level security, and requests made for a store run under a database role limited to that store's rows.",
        "**Cookies.** Sign-in cookies are HTTP-only, SameSite=Lax and Secure in production.",
        "**Payments.** Card and bank details go to the store's payment provider, never to Prood. Payment confirmations are checked against the store's own secret.",
        "**Retention.** A daily job deletes expired sessions and verification links, expired team invitations and old agent activity records, and account and store deletion are self-service. See the [privacy policy](/privacy).",
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
        "Sessions last 7 days from last use. Resetting a password signs every other session out.",
        "Sign-in, the API and agents are rate limited.",
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
          "no passkeys yet. Two-factor sign-in with an authenticator app is available but optional;",
          "no ISO 27001 or SOC 2 certification, and no external penetration test yet. Our hosting and database providers hold their own certifications, listed on the [sub-processors page](/subprocessors);",
          "no log of what Prood administrators read. What they change on accounts is recorded and kept for 24 months;",
          "no promised recovery time. Our database provider offers point-in-time restore.",
        ],
      },
    ],
  },
  {
    title: "Incidents",
    id: "incidents",
    body: [
      `If a personal data breach affects a store's data, we tell its owners by email without undue delay and within 48 hours of becoming aware of it, as the [data processing terms](/dpa) say. ${legal.name} reports breaches to the Portuguese data protection authority where the law requires.`,
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
