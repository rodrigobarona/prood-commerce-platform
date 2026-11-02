/* eslint-disable @eslint-react/no-array-index-key -- static placeholder lists */
import { Panel } from "@prood/ui/components/panel"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@prood/ui/components/sidebar"
import { Skeleton } from "@prood/ui/components/skeleton"
import { Stat, StatGrid } from "@prood/ui/components/stat-grid"
import { DetailLayout } from "@prood/ui/components/page-layout"
import { DashboardFormPage, DashboardPage } from "@/components/layout/dashboard-page"

function times(count: number) {
  return Array.from({ length: count }, (_, index) => index)
}

/** Holds the height of `PageHeader`, so the page doesn't jump when the title arrives. */
export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-5 w-64 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-28 shrink-0 rounded-lg" /> : null}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <StatGrid className="grid-cols-2">
      {times(4).map((index) => (
        <Stat
          key={index}
          label={<Skeleton className="h-5 w-24" />}
          value={<Skeleton className="h-9 w-20" />}
          hint={<Skeleton className="h-4 w-16" />}
        />
      ))}
    </StatGrid>
  )
}

export function TablePanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Panel flush>
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      {times(rows).map((index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 last:border-0"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5.5 w-20 rounded-full" />
        </div>
      ))}
    </Panel>
  )
}

export function FormPanelSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <Panel>
      <div className="flex flex-col gap-4">
        {times(fields).map((index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function FormPageSkeleton() {
  return (
    <>
      <FormPanelSkeleton fields={4} />
      <FormPanelSkeleton />
    </>
  )
}

export function DetailSkeleton() {
  return (
    <DetailLayout
      main={<FormPanelSkeleton fields={4} />}
      aside={
        <>
          <FormPanelSkeleton fields={2} />
          <FormPanelSkeleton fields={1} />
        </>
      }
    />
  )
}

export function IntegrationsSkeleton() {
  return <TablePanelSkeleton rows={3} />
}

export function DomainsSkeleton() {
  return (
    <>
      <FormPanelSkeleton fields={1} />
      <TablePanelSkeleton rows={2} />
    </>
  )
}

export function BillingSkeleton() {
  return <FormPanelSkeleton fields={3} />
}

/** Full-page fallbacks for `loading.tsx` and the shell. */
export function PageSkeleton({ action = false }: { action?: boolean }) {
  return (
    <DashboardPage>
      <PageHeaderSkeleton action={action} />
      <TablePanelSkeleton />
    </DashboardPage>
  )
}

export function FormRouteSkeleton() {
  return (
    <DashboardFormPage>
      <PageHeaderSkeleton />
      <FormPageSkeleton />
    </DashboardFormPage>
  )
}

export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </SidebarHeader>
      <SidebarContent>
        {[4, 3, 3].map((items, group) => (
          <SidebarGroup key={group} className="px-3 py-2">
            <SidebarMenu>
              {times(items).map((index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Skeleton className="h-12 w-full rounded-lg" />
      </SidebarFooter>
    </Sidebar>
  )
}
