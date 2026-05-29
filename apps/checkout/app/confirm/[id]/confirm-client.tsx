"use client"

import { useEffect, useState } from "react"

export function ConfirmClient({
  sessionId,
  chargeId,
}: {
  sessionId: string
  chargeId: string | null
}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chargeId }),
    })
      .then((r) => r.json())
      .then((data: { state?: string; returnUrl?: string; orderId?: string; error?: string }) => {
        if (data.error) {
          setErrorMsg(data.error)
          setStatus("error")
          return
        }
        if (data.returnUrl) {
          const url = new URL(data.returnUrl)
          if (data.orderId) url.searchParams.set("orderId", data.orderId)
          setReturnUrl(url.toString())
        }
        setStatus("success")
      })
      .catch(() => {
        setErrorMsg("Confirmation failed")
        setStatus("error")
      })
  }, [sessionId, chargeId])

  useEffect(() => {
    if (status === "success" && returnUrl) {
      const timer = setTimeout(() => {
        window.location.href = returnUrl
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, returnUrl])

  if (status === "loading") {
    return (
      <div className="bg-background flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-sm">
        <p className="text-muted-foreground text-sm">Confirming your payment...</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="bg-background flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-red-600">Payment Error</h2>
        <p className="text-muted-foreground text-sm">{errorMsg}</p>
      </div>
    )
  }

  return (
    <div className="bg-background flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-green-600">Payment Confirmed</h2>
      <p className="text-muted-foreground text-sm">
        {returnUrl ? "Redirecting you back to the store..." : "Thank you for your purchase."}
      </p>
    </div>
  )
}
