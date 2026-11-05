import { pages, type PageSection, type SitePage } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

function pageLine(page: SitePage): string {
  const url = `${siteConfig.url}${page.path === "/" ? "" : page.path}`
  return `- [${page.title ?? "Home"}](${url}): ${page.description}`
}

function section(name: PageSection): string[] {
  return Object.values(pages)
    .filter((page) => page.section === name)
    .map(pageLine)
}

/** `/llms.txt`: what Prood is and where to read more, per https://llmstxt.org. */
export function llmsTxt(): string {
  const docsOrigin = new URL(siteConfig.docsUrl).origin
  return [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Merchant stores run on their own domain or on \`{store}.${siteConfig.storeDomain}\`. Each store publishes its own \`/llms.txt\` and a Markdown version of its catalog pages.`,
    "",
    "## Product",
    "",
    ...section("Product"),
    "",
    "## Developers",
    "",
    `- [Developer docs](${docsOrigin}/llms.txt): guides and API reference, also as Markdown`,
    `- [Full docs in one file](${docsOrigin}/llms-full.txt)`,
    `- [API reference](${siteConfig.apiReferenceUrl}): REST \`/v1\`, OpenAPI, MCP and Agent Auth`,
    `- [Demo store](${siteConfig.demoStoreUrl}/llms.txt): a store's own llms.txt, with sample data`,
    "",
    "## Optional",
    "",
    ...section("About"),
    ...section("Legal"),
    `- Contact: ${siteConfig.email}`,
    "",
  ].join("\n")
}
