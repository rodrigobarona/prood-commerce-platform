import type { Attribute, Product } from "@prood/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@prood/ui/components/accordion"
import { localized } from "@prood/ui/lib/commerce"

/** Attributes long enough to be sections of their own, in reading order. */
const NOTES = ["care", "delivery", "returns"]

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="data-open:bg-transparent">
      <AccordionTrigger headingLevel="h2" className="px-0 py-4 font-sans text-base font-normal">
        {title}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground">{children}</AccordionContent>
    </AccordionItem>
  )
}

function Facts({ attributes }: { attributes: Attribute[] }) {
  return (
    <dl className="flex flex-col gap-2">
      {attributes.map((attribute) => (
        <div key={attribute.code} className="flex justify-between gap-4">
          <dt>{localized(attribute.name)}</dt>
          <dd className="text-foreground">{localized(attribute.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Only what the store wrote: a section with nothing in it isn't shown. */
export function ProductDetails({ product }: { product: Product }) {
  const description = localized(product.description)
  const facts = product.attributes.filter((attribute) => !NOTES.includes(attribute.code))
  const notes = NOTES.flatMap((code) => product.attributes.filter((attribute) => attribute.code === code))
  if (!description && facts.length === 0 && notes.length === 0) return null

  return (
    <Accordion
      type="multiple"
      defaultValue={["details"]}
      className="rounded-none border-x-0 border-b-0 [&_[data-slot=accordion-content]]:px-0 [&_[data-slot=accordion-item]]:border-b"
    >
      {description || facts.length > 0 ? (
        <Section value="details" title="Details">
          <div className="flex flex-col gap-4">
            {description ? <p className="whitespace-pre-line">{description}</p> : null}
            {facts.length > 0 ? <Facts attributes={facts} /> : null}
          </div>
        </Section>
      ) : null}
      {notes.map((note) => (
        <Section key={note.code} value={note.code} title={localized(note.name)}>
          <p className="whitespace-pre-line">{localized(note.value)}</p>
        </Section>
      ))}
    </Accordion>
  )
}
