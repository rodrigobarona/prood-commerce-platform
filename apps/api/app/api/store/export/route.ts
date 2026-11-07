import { NextResponse } from "next/server"
import { jsonDownload } from "@prood/auth/download"
import { exportStoreData } from "@prood/commerce/store-data"
import { errorResponse } from "@/lib/api"
import { requireCaller } from "@/lib/auth-tenant"

/**
 * Everything the active store owns, as one JSON file: the export a merchant uses to
 * leave or to answer a data request. Owners and admins, from a signed-in session.
 * It is not part of /v1, so an API key or an AI agent can't pull it.
 */
export async function GET() {
  try {
    const caller = await requireCaller("admin")
    if (caller.via !== "session") {
      return NextResponse.json({ error: "Download the export from your dashboard." }, { status: 403 })
    }
    return jsonDownload("prood-store.json", await exportStoreData(caller.orgId))
  } catch (err) {
    return errorResponse(err)
  }
}
