import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"
import { pageMetadata } from "@/lib/metadata"
import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export const metadata = pageMetadata(pages.legal)

const { legal, email } = siteConfig

const sections: readonly LegalSection[] = [
  {
    title: "Company",
    id: "company",
    body: [
      "The information below is provided under Article 171 of the Portuguese Commercial Companies Code and Article 10 of Decree-Law 7/2004.",
      {
        table: {
          head: ["Item", "Detail"],
          rows: [
            ["Company name", legal.registeredName],
            ["Short name", legal.name],
            ["Legal form", "Sociedade por quotas (private limited company)"],
            ["Registered office", legal.address],
            ["Commercial registry", legal.registry],
            ["Tax and registry number (NIPC)", legal.vat],
            ["VAT number", `PT${legal.vat}`],
            ["Service", `Prood, at prood.com and on \`prood.app\``],
          ],
        },
      },
    ],
  },
  {
    title: "Contact",
    id: "contact",
    body: [
      `For support, legal and contract matters, privacy and data rights, reports of illegal content and security issues, write to [${email}](mailto:${email}). It is also our point of contact for authorities and for users of the service under Regulation (EU) 2022/2065.`,
      "Supervisory authority for data protection: the [Comissão Nacional de Proteção de Dados](https://www.cnpd.pt). Complaints book: [livroreclamacoes.pt](https://www.livroreclamacoes.pt).",
    ],
  },
  {
    title: "Documents",
    id: "documents",
    body: {
      list: [
        "[Terms of service](/terms)",
        "[Privacy policy](/privacy), including cookies",
        "[Data processing terms](/dpa)",
        "[Sub-processors](/subprocessors)",
        "[Security](/security)",
      ],
    },
  },
]

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Legal notice"
      summary="Who runs Prood and how to reach us."
      sections={sections}
      related={[
        { label: "Terms of service", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
      ]}
    />
  )
}
