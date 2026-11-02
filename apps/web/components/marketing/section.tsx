import type { CSSProperties } from "react"

import { cn } from "@prood/ui/lib/utils"
import { TileEdge } from "@prood/ui/components/tile"
import { FULL_BLEED_SIZES } from "@prood/media"
import { MediaImage } from "@prood/media/image"

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12", className)}>{children}</div>
}

export function Section({
  id,
  labelledBy,
  surface = "page",
  className,
  children,
}: {
  id?: string
  /** id of the section heading, for the landmark's accessible name */
  labelledBy: string
  surface?: "page" | "ink" | "muted"
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "py-20 md:py-32",
        surface === "ink" && "surface-ink",
        surface === "muted" && "bg-muted",
        className
      )}
    >
      <Container>{children}</Container>
    </section>
  )
}

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-eyebrow text-brand", className)}>{children}</p>
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
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 id={id} className={cn("text-display-md", eyebrow && "mt-4")}>
        {title}
      </h2>
      {description ? <p className="mt-6 text-lead text-muted-foreground">{description}</p> : null}
    </div>
  )
}

/**
 * Opening block for inner pages: a full-bleed photograph with one h1 over it, on
 * the left. Frame the photograph with `position` so its subject sits on the
 * right, and the page hangs from it in tiles. Pass `inset` when the subject needs
 * to stay clear of the headline: the photograph then takes the right of the frame
 * and fades into Ink. The site header sits on top, so the page's route must be
 * listed in `overlayRoutes` (lib/site.ts).
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  position = "50% 50%",
  positionMobile,
  inset = false,
  stock = false,
  object,
  below = "text-background",
  children,
}: {
  eyebrow: string
  /** Sentences that should break apart go in as lines, one per entry. */
  title: string | readonly string[]
  lead: string
  /** Slug in the media library. */
  image: string
  /** CSS object-position, to keep faces clear of the text. */
  position?: string
  /** Object-position on phones, where the frame turns tall. */
  positionMobile?: string
  /** Hold the photograph to the right of the frame, clear of the headline. */
  inset?: boolean
  /** Add the stock note: there are people in this photograph, next to a claim. */
  stock?: boolean
  /** One owned object, hanging across the seam at the right of the frame. Label it as an example. */
  object?: React.ReactNode
  /** The color of the section that follows, showing between the tiles. */
  below?: string
  children?: React.ReactNode
}) {
  const lines = typeof title === "string" ? [title] : title
  const framing = {
    "--position": position,
    "--position-mobile": positionMobile ?? position,
  } as CSSProperties

  return (
    <div className="relative">
      <div className="relative">
        <div className="surface-ink surface-photo relative -mt-16 flex min-h-[max(78svh,36rem)] flex-col justify-end overflow-hidden">
          <div className={cn("absolute inset-0", inset && "bottom-auto h-72 md:bottom-0 md:left-[30%] md:h-auto")}>
            <MediaImage
              slug={image}
              fill
              preload
              sizes={inset ? "(min-width: 768px) 70vw, 160vw" : FULL_BLEED_SIZES}
              className="object-cover [object-position:var(--position-mobile)] md:[object-position:var(--position)]"
              style={framing}
            />
            {inset ? <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-ink to-transparent md:hidden" /> : null}
          </div>
          {inset ? (
            <>
              <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-ink/70 to-transparent" />
              <div
                aria-hidden
                className="absolute inset-0 hidden bg-linear-to-r from-ink from-30% via-ink/60 via-55% to-ink/5 md:block"
              />
            </>
          ) : (
            <>
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink/95 via-ink/75 to-ink/55 md:from-ink/90 md:via-ink/20 md:to-transparent" />
              <div aria-hidden className="absolute inset-0 hidden bg-linear-to-r from-ink/90 via-ink/65 via-45% to-transparent to-75% md:block" />
            </>
          )}
          <Container className={cn("relative pb-24 md:pt-32 md:pb-28", inset ? "pt-64" : "pt-32")}>
            <Eyebrow className="text-paper">{eyebrow}</Eyebrow>
            <h1 className="mt-4 text-display-lg text-paper max-sm:text-[10.2vw]">
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}{" "}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-lead text-paper/90">{lead}</p>
            {children ? <div className="mt-9 flex flex-wrap gap-3">{children}</div> : null}
            {stock ? <StockNote className="mt-6 text-paper/80" /> : null}
          </Container>
        </div>
        <TileEdge awning className={cn("absolute inset-x-0 bottom-0", below)} />
      </div>
      {object ? (
        <Container className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden lg:block">
          <div className="absolute right-12 bottom-[-3.5rem]">{object}</div>
        </Container>
      ) : null}
      {object ? (
        <div className={cn("relative z-10 bg-current lg:hidden", below)}>
          <Container className="flex justify-end">
            <div className="-mt-10">{object}</div>
          </Container>
        </div>
      ) : null}
    </div>
  )
}

/** Says what the pictures are, wherever people appear in a row of them or beside a claim. */
export function StockNote({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>Stock photo.</p>
}

/** A photograph on the page, framed the same way everywhere. */
export function Photo({
  slug,
  sizes,
  className,
  position,
  children,
}: {
  slug: string
  sizes: string
  /** Sets the shape: pass an aspect ratio. */
  className?: string
  position?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-muted", className)}>
      <MediaImage
        slug={slug}
        fill
        sizes={sizes}
        className="object-cover"
        style={position ? { objectPosition: position } : undefined}
      />
      {children}
    </div>
  )
}
