import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@prood/ui/lib/utils"

export function SectionHeader({
  title,
  text,
  href,
  linkLabel,
}: {
  title: string
  /** One line of voice under the heading. */
  text?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className={cn("flex justify-between gap-6", text ? "flex-col gap-3 sm:flex-row sm:items-end" : "items-end")}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-display-sm">{title}</h2>
        {text ? <p className="text-muted-foreground">{text}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 pb-1 text-sm transition-colors"
        >
          {linkLabel}
          <ArrowRightIcon className="size-3.5" />
        </Link>
      ) : null}
    </div>
  )
}
