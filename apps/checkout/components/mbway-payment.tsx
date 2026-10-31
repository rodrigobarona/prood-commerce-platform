"use client"

import { useEffect, useState } from "react"
import { MBWAY_WINDOW_MS } from "@prood/types"

const CHECK_EVERY_MS = 4000
// Past the server's window, so a retry is sure to find the request dead.
const GRACE_MS = 5000

export type MbWayEnd = "failed" | "timed_out"

function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(?=\d)/g, "$1 ")
}

export function MbWayPayment({
  sessionId,
  phone,
  startedAt,
  onEnd,
}: {
  sessionId: string
  phone?: string
  startedAt: string
  /** `payable` is what the check found; a timeout didn't ask. */
  onEnd: (end: MbWayEnd, payable?: boolean) => void
}) {
  const deadline = new Date(startedAt).getTime() + MBWAY_WINDOW_MS + GRACE_MS
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - GRACE_MS - Date.now()) / 1000))
      setSecondsLeft(left)
      if (Date.now() >= deadline) onEnd("timed_out")
    }
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [deadline, onEnd])

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/confirm`, { method: "POST" })
        // A failed check says nothing about the payment: keep waiting.
        if (!res.ok || !active) return
        const { state, payable } = (await res.json()) as { state: string; payable: boolean }
        if (state === "complete" || state === "pending") window.location.href = `/confirm/${sessionId}`
        if (state === "failed") onEnd("failed", payable)
      } catch {
        // Same: the next check decides.
      }
    }
    const timer = setInterval(() => void check(), CHECK_EVERY_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [sessionId, onEnd])

  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-5 text-center" role="status">
      <h3 className="font-semibold">Approve the payment in MB WAY</h3>
      <p className="text-muted-foreground text-sm">
        {phone ? `We sent a request to ${formatPhone(phone)}. ` : "We sent a request to your phone. "}
        Open the MB WAY app and approve it.
      </p>
      {secondsLeft !== null ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
        </p>
      ) : null}
    </div>
  )
}
