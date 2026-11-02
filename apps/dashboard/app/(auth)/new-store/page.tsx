import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { NewStoreForm } from "@/components/auth/new-store-form"
import { getSession, listOrganizations } from "@/lib/auth"

export const metadata = { title: "Create your store" }

async function NewStoreGate() {
  const session = await getSession()
  if (!session) redirect("/login")
  const stores = await listOrganizations()
  return <NewStoreForm hasStores={stores.length > 0} />
}

export default function NewStorePage() {
  return (
    <AuthPage image="owner-counter" line="Your store, your payment accounts, your keys.">
      <Suspense fallback={<AuthFormSkeleton />}>
        <NewStoreGate />
      </Suspense>
    </AuthPage>
  )
}
