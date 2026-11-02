import { Suspense, type ReactNode } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { SidebarInset, SidebarProvider } from "@prood/ui/components/sidebar"
import { SkipLink } from "@prood/ui/components/skip-link"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import type { OrgSummary } from "@/components/layout/org-switcher"
import { ViewStoreLink } from "@/components/layout/view-store-link"
import { PageSkeleton, SidebarSkeleton } from "@/components/skeletons"
import {
  getActiveOrganizationId,
  getSession,
  listOrganizations,
} from "@/lib/auth"

function ShellContent({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
}

/**
 * Reads the session, so it sits behind the layout's Suspense boundary: the
 * shell's skeleton shows at once and nothing below renders until the session is
 * confirmed, the same gate as before. The provider stays inside the boundary so
 * it hydrates with the sidebar; above it, a phone flips `isMobile` first and the
 * sidebar no longer matches the server's HTML.
 */
async function DashboardShell({ children }: { children: ReactNode }) {
  await connection()

  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const [activeOrgId, orgResults] = await Promise.all([
    getActiveOrganizationId(),
    listOrganizations(),
  ])

  // An account can end up with no store, e.g. after signing up through an
  // invitation that had expired.
  if (orgResults.length === 0) redirect("/new-store")

  const orgs: OrgSummary[] = orgResults.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
  }))

  return (
    <SidebarProvider>
      <SkipLink />
      <DashboardSidebar
        orgs={orgs}
        activeOrgId={activeOrgId}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SidebarInset className="min-w-0">
        <DashboardHeader
          storeLink={
            <Suspense fallback={null}>
              <ViewStoreLink />
            </Suspense>
          }
        />
        <ShellContent>{children}</ShellContent>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <SidebarProvider>
          <SkipLink />
          <SidebarSkeleton />
          <SidebarInset className="min-w-0">
            <DashboardHeader />
            <ShellContent>
              <PageSkeleton />
            </ShellContent>
          </SidebarInset>
        </SidebarProvider>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  )
}
