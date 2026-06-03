import { Suspense } from "react"
import { redirect } from "next/navigation"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { ChangePasswordForm } from "@/components/account/change-password-form"
import { ProfileForm } from "@/components/account/profile-form"
import { FormPageSkeleton } from "@/components/skeletons"
import { getCurrentUser } from "@/lib/auth"

export const metadata = { title: "Profile" }

export default function AccountPage() {
  return (
    <DashboardFormPage>
      <div>
        <h2 className="font-heading text-xl font-medium">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal account details and sign-in password.
        </p>
      </div>
      <Suspense fallback={<FormPageSkeleton />}>
        <AccountContent />
      </Suspense>
    </DashboardFormPage>
  )
}

async function AccountContent() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <>
      <ProfileForm
        initial={{
          name: user.name,
          email: user.email,
          image: user.image ?? "",
        }}
      />
      <ChangePasswordForm />
    </>
  )
}
