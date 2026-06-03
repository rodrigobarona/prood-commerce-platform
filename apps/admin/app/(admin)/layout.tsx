import { redirect } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@prood/ui/components/sidebar"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"
import { requireAdmin } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session: Awaited<ReturnType<typeof requireAdmin>> = null
  try {
    session = await requireAdmin()
  } catch (err) {
    console.error("[AdminLayout] requireAdmin() threw:", err)
  }

  if (!session) {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.warn("[AdminLayout] session is null — redirecting to /login")
    }
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
