import { NextResponse } from "next/server"
import { exportAccountData } from "@prood/auth/data-export"
import { jsonDownload } from "@prood/auth/download"
import { getSession } from "@/lib/auth"

/**
 * The signed-in shopper's own sign-in data (GDPR Art. 15 and 20). Orders and delivery
 * details belong to each store, so they come from the store.
 */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 })
  const data = await exportAccountData(session.user.id)
  if (!data) return NextResponse.json({ error: "Account not found." }, { status: 404 })
  return jsonDownload("account.json", data)
}
