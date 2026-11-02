import { Suspense } from "react"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { ChangePasswordForm } from "@/components/account/change-password-form"
import { ProfileForm } from "@/components/account/profile-form"
import { FormPageSkeleton } from "@/components/skeletons"
import { getCurrentUser } from "@/lib/auth"

export const metadata = { title: "Profile" }

export default function AccountPage() {
  return (
    <DashboardFormPage>
      <PageHeader title="Profile" description="Your own account, across every store you work on." />
      <Suspense fallback={<FormPageSkeleton />}>
        <AccountContent />
      </Suspense>
    </DashboardFormPage>
  )
}

async function AccountContent() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <Panel>
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t load your profile. Refresh the page to try again.
        </p>
      </Panel>
    )
  }

  return (
    <>
      <ProfileForm initial={{ name: user.name, email: user.email }} />
      <ChangePasswordForm />
    </>
  )
}
