import type { ReactNode } from "react"
import { PageStack } from "@prood/ui/components/page-layout"
import { cn } from "@prood/ui/lib/utils"

/** Lists, tables and detail grids. The shell sets the width. */
export const DashboardPage = PageStack

/** Settings and forms: narrower, and left-aligned so titles don't jump between pages. */
export function DashboardFormPage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <PageStack className={cn("max-w-2xl", className)}>{children}</PageStack>
}
