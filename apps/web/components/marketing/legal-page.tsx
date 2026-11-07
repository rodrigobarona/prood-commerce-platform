import Link from "next/link"
import type { ReactNode } from "react"

import { Container, Eyebrow } from "@/components/marketing/section"

/**
 * One block of a legal section. A plain string is a paragraph. Inline text takes
 * `**bold**`, `` `code` `` and `[label](href)`; an `href` starting with `/` is an
 * internal link, `mailto:` and `https:` links open as they are.
 */
export type LegalBlock =
  | string
  | { list: readonly string[] }
  | { table: { head: readonly string[]; rows: readonly (readonly string[])[] } }

export interface LegalSection {
  /** Used for the anchor and the "On this page" list. */
  title: string
  /** Anchor override, so a clause can be linked to by a stable name. */
  id?: string
  /** Annexes keep their own title and take no number. */
  annex?: boolean
  body: LegalBlock | readonly LegalBlock[]
}

export function LegalPage({
  title,
  summary,
  sections,
  related,
}: {
  title: string
  summary: string
  sections: readonly LegalSection[]
  related: readonly { label: string; href: string }[]
}) {
  const numbered = numberSections(sections)
  return (
    <Container className="grid gap-x-16 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <article>
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 text-display-md">{title}</h1>
        <p className="mt-6 max-w-2xl rounded-lg border border-border bg-card px-4 py-3 text-[0.9375rem] leading-6 text-muted-foreground">
          {summary}
        </p>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {numbered.map(({ section, id, label }) => (
            <section
              key={id}
              aria-labelledby={id}
              className="grid scroll-mt-24 gap-x-10 gap-y-3 py-7 md:grid-cols-[13rem_minmax(0,1fr)]"
            >
              <h2 id={id} className="scroll-mt-24 text-xl font-semibold">
                {label}
              </h2>
              <div className="min-w-0 space-y-4 leading-7 text-muted-foreground">
                {blocks(section.body).map((block) => (
                  <Block key={blockKey(block)} block={block} />
                ))}
              </div>
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
            {numbered.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </Container>
  )
}

/** Sections are numbered in order, so clauses can be cited ("section 13"). Annexes are not. */
function numberSections(sections: readonly LegalSection[]) {
  let n = 0
  return sections.map((section) => ({
    section,
    id: section.id ?? slug(section.title),
    label: section.annex ? section.title : `${++n}. ${section.title}`,
  }))
}

function blocks(body: LegalSection["body"]): readonly LegalBlock[] {
  return Array.isArray(body) ? body : [body as LegalBlock]
}

function blockKey(block: LegalBlock): string {
  if (typeof block === "string") return block
  return "list" in block ? block.list.join("|") : block.table.rows.map((row) => row.join("|")).join("|")
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p className="max-w-2xl">{inline(block)}</p>
  if ("list" in block) {
    return (
      <ul className="max-w-2xl list-disc space-y-2 pl-5 marker:text-border">
        {block.list.map((item) => (
          <li key={item}>{inline(item)}</li>
        ))}
      </ul>
    )
  }
  const { head, rows } = block.table
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm leading-6">
        <thead className="bg-card text-foreground">
          <tr>
            {head.map((cell) => (
              <th key={cell || "blank"} scope="col" className="px-4 py-2.5 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.join("|")} className="align-top">
              {row.map((cell, column) => (
                <td key={head[column]} className={column === 0 ? "px-4 py-2.5 font-medium text-foreground" : "px-4 py-2.5"}>
                  {inline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function inline(text: string): ReactNode[] {
  let offset = 0
  return text.split(INLINE).map((part) => {
    const index = offset
    offset += part.length
    if (part.startsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`")) {
      return (
        <code key={index} className="rounded bg-card px-1 py-0.5 font-mono text-[0.875em] text-foreground">
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      const [, label, href] = link
      const className = "font-medium text-foreground underline underline-offset-4"
      return href!.startsWith("/") ? (
        <Link key={index} href={href!} className={className}>
          {label}
        </Link>
      ) : (
        <a key={index} href={href} className={className}>
          {label}
        </a>
      )
    }
    return part
  })
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
