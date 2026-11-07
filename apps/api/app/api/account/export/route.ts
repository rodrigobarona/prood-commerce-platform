import { NextResponse } from "next/server"
import { exportAccountData } from "@prood/auth/data-export"
import { jsonDownload } from "@prood/auth/download"
import { getSession } from "@/lib/auth"

/** The signed-in person's own data (GDPR Art. 15 and 20). Session only: never a key or an agent. */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 })
  const data = await exportAccountData(session.user.id)
  if (!data) return NextResponse.json({ error: "Account not found." }, { status: 404 })
  return jsonDownload("prood-account.json", data)
}
