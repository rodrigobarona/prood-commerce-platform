import { Suspense } from "react"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { ChangePasswordForm } from "@/components/account/change-password-form"
import { PasskeysPanel } from "@/components/account/passkeys-panel"
import { ProfileForm } from "@/components/account/profile-form"
import { TwoFactorPanel } from "@/components/account/two-factor-panel"
import { YourData } from "@/components/account/your-data"
import { FormPageSkeleton } from "@/components/skeletons"
import { getCurrentUser } from "@/lib/auth"
import { isPasskeyEnabled } from "@prood/auth/passkey-config"
import { isTwoFactorEnabled } from "@prood/auth/two-factor"

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

  const twoFactor = await isTwoFactorEnabled(user.id)

  return (
    <>
      <ProfileForm initial={{ name: user.name, email: user.email }} />
      <ChangePasswordForm />
      <TwoFactorPanel enabled={twoFactor} />
      {isPasskeyEnabled() ? <PasskeysPanel /> : null}
      <YourData />
    </>
  )
}
