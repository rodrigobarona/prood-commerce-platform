import Link from "next/link"

import { Container, Eyebrow } from "@/components/marketing/section"

export function LegalPage({
  title,
  summary,
  sections,
  related,
}: {
  title: string
  summary: string
  sections: readonly { title: string; body: string }[]
  related: { label: string; href: string }
}) {
  return (
    <Container className="py-16 md:py-24">
      <article className="max-w-2xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">{title}</h1>
        <p className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-[0.9375rem] leading-6 text-muted-foreground">
          {summary}
        </p>
        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={slug(section.title)}>
              <h2 id={slug(section.title)} className="text-xl font-semibold">
                {section.title}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-14 border-t border-border pt-6 text-sm">
          <Link href={related.href} className="font-medium underline underline-offset-4">
            {related.label}
          </Link>
        </p>
      </article>
    </Container>
  )
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}
