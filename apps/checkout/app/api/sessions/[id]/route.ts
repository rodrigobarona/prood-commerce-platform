import { NextResponse } from "next/server"
import { loadSession } from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const stored = await loadSession(id)
    if (!stored) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      sessionId: id,
      providerId: stored.meta.providerId,
      publishableKey: stored.meta.publishableKey,
      kind: stored.meta.kind,
      storeName: stored.meta.storeName ?? null,
      returnUrl: stored.meta.returnUrl ?? null,
      ...stored.snapshot,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
