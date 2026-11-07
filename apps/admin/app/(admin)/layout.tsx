import { Suspense, type ReactNode } from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@prood/ui/components/sidebar"
import { SkipLink } from "@prood/ui/components/skip-link"
import { PageSkeleton, SidebarSkeleton } from "@/components/admin/skeletons"
import { AdminHeader } from "@/components/layout/admin-header"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { isTwoFactorEnabled } from "@prood/auth/two-factor"
import { requiredEnv } from "@prood/types"
import { assertAdmin } from "@/lib/auth"

function ShellContent({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
      {children}
    </div>
  )
}

/** This console can see every account, so an admin without a second sign-in step is told to add one. */
function TwoFactorNotice() {
  // The dashboard is another app on the same domain, so this is a plain link: NEXT_PUBLIC_DASHBOARD_URL carries its path.
  const profile = `${requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL").replace(/\/$/, "")}/account`
  return (
    <p
      role="status"
      className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-pretty"
    >
      Your admin account has no two-factor sign-in. This console can see every account on Prood, so turn it on under{" "}
      <a href={profile} className="font-medium underline underline-offset-4">
        Profile in the dashboard
      </a>
      .
    </p>
  )
}

async function AdminShell({ children }: { children: ReactNode }) {
  const session = await assertAdmin()
  const twoFactor = await isTwoFactorEnabled(session.user.id)

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
        <ShellContent>
          {twoFactor ? null : <TwoFactorNotice />}
          {children}
        </ShellContent>
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
