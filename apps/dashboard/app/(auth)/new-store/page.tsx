import { redirect } from "next/navigation"
import { NewStoreForm } from "@/components/auth/new-store-form"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Create your store" }

export default async function NewStorePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <NewStoreForm />
}
