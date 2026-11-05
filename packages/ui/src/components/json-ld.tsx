import { jsonLdScript, type JsonLdThing } from "@prood/ui/lib/json-ld"

export function JsonLd({ data }: { data: JsonLdThing | JsonLdThing[] }) {
  // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- JSON with `<` escaped, so it can't close the script
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
}
