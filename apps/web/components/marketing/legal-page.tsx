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
  related: readonly { label: string; href: string }[]
}) {
  return (
    <Container className="grid gap-x-16 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <article>
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 text-display-md">{title}</h1>
        <p className="mt-6 max-w-2xl rounded-lg border border-border bg-card px-4 py-3 text-[0.9375rem] leading-6 text-muted-foreground">
          {summary}
        </p>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {sections.map((section) => (
            <section
              key={section.title}
              aria-labelledby={slug(section.title)}
              className="grid scroll-mt-24 gap-x-10 gap-y-3 py-7 md:grid-cols-[13rem_minmax(0,1fr)]"
            >
              <h2 id={slug(section.title)} className="scroll-mt-24 text-xl font-semibold">
                {section.title}
              </h2>
              <p className="max-w-2xl leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {related.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium underline underline-offset-4">
              {link.label}
            </Link>
          ))}
        </p>
      </article>
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-24 border-l border-border pl-5">
          <p className="text-sm font-semibold">On this page</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            {sections.map((section) => (
              <li key={section.title}>
                <a
                  href={`#${slug(section.title)}`}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </Container>
  )
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}
