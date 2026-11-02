import type { ReactNode } from "react"
import Link from "next/link"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { cn } from "@prood/ui/lib/utils"

export interface HeroBannerProps {
  title: string
  subtitle?: string
  /** A filled image (`next/image` or `MediaImage` with `fill`). Text sits on it, over a scrim. */
  media?: ReactNode
  align?: "start" | "center"
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}

const ALIGN: Record<NonNullable<HeroBannerProps["align"]>, string> = {
  start: "items-start text-left",
  center: "items-center text-center",
}

/** The one loud thing on a store's home page. Full bleed, with or without a photograph. */
export function HeroBanner({
  title,
  subtitle,
  media,
  align = "start",
  primaryLabel,
  primaryHref = "#",
  secondaryLabel,
  secondaryHref = "#",
  className,
}: HeroBannerProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[68svh] w-full flex-col justify-end overflow-hidden md:min-h-[78svh]",
        media ? "bg-ink" : "bg-muted",
        className,
      )}
    >
      {media}
      {media ? (
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-black/10" />
      ) : null}
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[84rem] flex-col gap-5 px-5 pt-16 pb-10 md:gap-7 md:px-8 md:pb-14 lg:px-12 lg:pb-16",
          ALIGN[align],
        )}
      >
        <h1 className={cn("text-display-xl max-w-5xl text-balance", media ? "text-paper" : "text-foreground")}>
          {title}
        </h1>
        {subtitle ? (
          <p className={cn("text-lead max-w-xl text-pretty", media ? "text-paper/90" : "text-muted-foreground")}>
            {subtitle}
          </p>
        ) : null}
        {primaryLabel || secondaryLabel ? (
          <div className="flex flex-wrap gap-3">
            {primaryLabel ? (
              <CommerceButton asChild variant={media ? "paper" : "default"}>
                <Link href={primaryHref}>{primaryLabel}</Link>
              </CommerceButton>
            ) : null}
            {secondaryLabel ? (
              <CommerceButton asChild variant={media ? "on-photo" : "outline"}>
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </CommerceButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
