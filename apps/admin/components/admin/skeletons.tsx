import { FactList } from "@prood/ui/components/fact-list"
import { PageHeader } from "@prood/ui/components/page-header"
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
import { DetailLayout, PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { SidebarBrand } from "@/components/layout/admin-sidebar"

function Bar({ className }: { className: string }) {
  return <Skeleton className={`rounded-md ${className}`} />
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-6 px-5 py-3">
          <Bar className="h-4 w-36" />
          <Bar className="hidden h-4 w-48 sm:block" />
          <Bar className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <Panel flush title={<Bar className="h-5 w-24" />}>
      <RowsSkeleton rows={rows} />
    </Panel>
  )
}

function FactsSkeleton({ rows }: { rows: number }) {
  return (
    <Panel title="Details">
      <FactList>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex justify-between gap-4">
            <Bar className="h-5 w-20" />
            <Bar className="h-5 w-24" />
          </div>
        ))}
      </FactList>
    </Panel>
  )
}

function DetailHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Bar className="h-4 w-32" />
      <Bar className="h-8 w-56" />
      <Bar className="h-4 w-40" />
    </div>
  )
}

export function ListLoading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <AdminPage>
      <PageHeader title={title} description={description} />
      <PanelSkeleton rows={8} />
    </AdminPage>
  )
}

export function DetailLoading() {
  return (
    <AdminPage>
      <DetailHeaderSkeleton />
      <DetailLayout
        aside={<FactsSkeleton rows={6} />}
        main={
          <>
            <PanelSkeleton rows={4} />
            <PanelSkeleton rows={3} />
          </>
        }
      />
    </AdminPage>
  )
}

export function OverviewLoading() {
  return (
    <AdminPage>
      <PageHeader
        title="Overview"
        description="How Prood is doing across every store."
      />
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2 bg-card p-5">
            <Bar className="h-4 w-24" />
            <Bar className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <PanelSkeleton rows={5} />
        </div>
        <PanelSkeleton rows={3} />
      </div>
    </AdminPage>
  )
}

export function LoginSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="flex flex-col gap-2">
        <Bar className="h-8 w-56" />
        <Bar className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-4">
        <Bar className="h-14 w-full" />
        <Bar className="h-14 w-full" />
        <Bar className="h-9 w-full" />
      </div>
    </div>
  )
}

/** The page's place while the session is checked; the route's own skeleton takes over after. */
export function PageSkeleton() {
  return (
    <AdminPage>
      <div className="flex flex-col gap-2">
        <Bar className="h-8 w-44" />
        <Bar className="h-4 w-64" />
      </div>
      <PanelSkeleton rows={6} />
    </AdminPage>
  )
}

export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        {[3, 4, 1].map((items) => (
          <SidebarGroup key={items} className="px-3 py-2">
            <SidebarMenu>
              {Array.from({ length: items }, (_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Bar className="h-12 w-full" />
      </SidebarFooter>
    </Sidebar>
  )
}
