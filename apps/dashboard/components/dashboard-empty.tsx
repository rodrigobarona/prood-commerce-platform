import type { Icon } from "@phosphor-icons/react"
import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@prood/ui/components/empty"
import { cn } from "@prood/ui/lib/utils"

export function DashboardEmpty({
  icon: IconComponent,
  title,
  description,
  actionLabel,
  actionHref,
  children,
  className,
  contentClassName,
}: {
  icon?: Icon
  title: string
  description?: React.ReactNode
  actionLabel?: string
  actionHref?: string
  children?: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Empty className={cn("border", className)}>
      <EmptyHeader>
        {IconComponent ? (
          <EmptyMedia variant="icon">
            <IconComponent />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {actionLabel || children ? (
        <EmptyContent className={contentClassName}>
          {actionLabel && actionHref ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
          {children}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
