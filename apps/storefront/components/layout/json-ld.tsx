import { jsonLdScript } from "@/lib/json-ld"

type Thing = Record<string, unknown>

export function JsonLd({ data }: { data: Thing | Thing[] }) {
  // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- JSON with `<` escaped, so it can't close the script
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
}
