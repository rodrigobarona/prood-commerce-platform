import { cn } from "@prood/ui/lib/utils"

/** Narrow column for dedicated settings/edit pages — not inline forms on list pages. */
export const dashboardFormColumnClass = "mx-auto w-full max-w-3xl"

/** Full-width dashboard content (lists, tables, detail grids). */
export function DashboardPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-6", className)}>
      {children}
    </div>
  )
}

/** Narrow, centered column for settings and edit forms. */
export function DashboardFormPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        cn(dashboardFormColumnClass, "flex min-w-0 flex-col gap-6"),
        className
      )}
    >
      {children}
    </div>
  )
}
