import { redirect } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@prood/ui/components/sidebar"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import type { OrgSummary } from "@/components/layout/org-switcher"
import {
  getActiveOrganizationId,
  getSession,
  listOrganizations,
} from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return <>{children}</>
  }

  let session: Awaited<ReturnType<typeof getSession>> = null
  try {
    session = await getSession()
  } catch (err) {
    console.error("[DashboardLayout] getSession() threw:", err)
  }
  if (!session) {
    redirect("/login")
  }

  const activeOrgId = await getActiveOrganizationId()

  let orgs: OrgSummary[] = []
  try {
    const result = await listOrganizations()
    orgs = result.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
    }))
  } catch {
    /* DB unavailable — render with no stores */
  }

  return (
    <SidebarProvider>
      <DashboardSidebar
        orgs={orgs}
        activeOrgId={activeOrgId}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
