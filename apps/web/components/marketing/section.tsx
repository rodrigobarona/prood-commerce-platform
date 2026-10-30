import { cn } from "@prood/ui/lib/utils"

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6", className)}>{children}</div>
}

export function Section({
  id,
  labelledBy,
  inverted = false,
  className,
  children,
}: {
  id?: string
  /** id of the section heading, for the landmark's accessible name */
  labelledBy: string
  /** Render the section in the dark palette whatever the page theme. */
  inverted?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "border-t border-border py-20 md:py-28",
        inverted && "dark border-transparent bg-background text-foreground",
        className
      )}
    >
      <Container>{children}</Container>
    </section>
  )
}

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("font-mono text-xs font-medium tracking-[0.12em] text-brand uppercase", className)}>
      {children}
    </p>
  )
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  id: string
  eyebrow?: string
  title: string
  description?: React.ReactNode
  align?: "start" | "center"
  className?: string
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        id={id}
        className="mt-3 text-3xl leading-[1.1] font-semibold tracking-[-0.025em] md:text-[2.75rem]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

/** Opening block for inner pages: one h1, a lead paragraph and optional actions. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  aside,
}: {
  eyebrow: string
  title: string
  lead: string
  children?: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden">
      <RingMotif className="pointer-events-none absolute -top-40 -right-48 hidden size-[34rem] text-muted md:block" />
      <Container
        className={cn(
          "relative py-16 md:py-24",
          aside && "grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
        )}
      >
        <div className="max-w-2xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl leading-[1.04] font-semibold tracking-[-0.035em] sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground md:text-xl md:leading-9">
            {lead}
          </p>
          {children ? <div className="mt-9 flex flex-wrap gap-3">{children}</div> : null}
        </div>
        {aside}
      </Container>
    </div>
  )
}

/** The "o" of the wordmark, used large and cropped as the site's one decorative motif. */
export function RingMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="5.5" />
    </svg>
  )
}
