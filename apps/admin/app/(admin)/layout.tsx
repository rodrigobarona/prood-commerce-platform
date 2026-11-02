import { Suspense, type ReactNode } from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@prood/ui/components/sidebar"
import { SkipLink } from "@prood/ui/components/skip-link"
import { PageSkeleton, SidebarSkeleton } from "@/components/admin/skeletons"
import { AdminHeader } from "@/components/layout/admin-header"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { assertAdmin } from "@/lib/auth"

function ShellContent({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
      {children}
    </div>
  )
}

async function AdminShell({ children }: { children: ReactNode }) {
  const session = await assertAdmin()

  return (
    <SidebarProvider>
      <SkipLink />
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SidebarInset className="min-w-0">
        <AdminHeader />
        <ShellContent>{children}</ShellContent>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Each branch owns its `SidebarProvider`. One shared across the boundary would
 * hydrate first and flip `isMobile` under the streamed sidebar on phones.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <SidebarProvider>
          <SkipLink />
          <SidebarSkeleton />
          <SidebarInset className="min-w-0">
            <AdminHeader />
            <ShellContent>
              <PageSkeleton />
            </ShellContent>
          </SidebarInset>
        </SidebarProvider>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
