import { redirect } from "next/navigation"
import { connection } from "next/server"
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
  await connection()

  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const [activeOrgId, orgResults] = await Promise.all([
    getActiveOrganizationId(),
    listOrganizations().catch(() => [] as Awaited<ReturnType<typeof listOrganizations>>),
  ])

  const orgs: OrgSummary[] = orgResults.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
  }))

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
