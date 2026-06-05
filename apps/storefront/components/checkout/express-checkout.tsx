"use client"

import { useCallback, useState } from "react"
import { Button } from "@prood/ui/components/button"
import { Separator } from "@prood/ui/components/separator"
import { cn } from "@prood/ui/lib/utils"
import { startCheckout } from "@/app/(checkout)/checkout/actions"

function ApplePayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.72 7.85c-.11.08-2.07 1.19-2.07 3.64.01 2.84 2.49 3.85 2.52 3.86-.01.06-.39 1.35-1.29 2.66-.78 1.14-1.59 2.28-2.87 2.3-1.25.03-1.65-.74-3.08-.74s-1.88.72-3.06.77c-1.23.04-2.17-1.23-2.97-2.37-1.62-2.33-2.86-6.58-1.2-9.46.83-1.43 2.31-2.33 3.91-2.35 1.21-.02 2.35.81 3.08.81.74 0 2.12-1 3.57-.86.61.03 2.32.25 3.41 1.85l.05.09zM14.94 4.78c.65-.79 1.09-1.89.97-2.98-.94.04-2.07.63-2.74 1.41-.6.69-1.13 1.8-.99 2.86 1.05.08 2.12-.53 2.76-1.29z" />
    </svg>
  )
}

function GooglePayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.24 10.285V14.4h5.676c-.228 1.51-1.386 3.92-5.676 3.92-3.414 0-6.204-2.826-6.204-6.306S8.826 5.708 12.24 5.708c1.944 0 3.246.828 3.996 1.542l2.718-2.616C16.974 2.85 14.826 1.8 12.24 1.8 6.478 1.8 1.8 6.478 1.8 12.24S6.478 22.68 12.24 22.68c5.952 0 9.9-4.182 9.9-10.074 0-.678-.072-1.194-.162-1.71H12.24z"
        fill="#4285F4"
      />
    </svg>
  )
}

interface ExpressCheckoutProps {
  className?: string
}

export function ExpressCheckout({ className }: ExpressCheckoutProps) {
  const [loading, setLoading] = useState<"apple" | "google" | null>(null)

  const handleExpressPayment = useCallback(
    async (method: "apple" | "google") => {
      setLoading(method)
      try {
        const res = await startCheckout({
          expressPayment: method,
        })
        if (res.ok && res.checkoutUrl) {
          window.location.href = res.checkoutUrl
        }
      } catch {
        // fall through — user can continue with standard checkout
      } finally {
        setLoading(null)
      }
    },
    [],
  )

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p className="text-center text-sm text-muted-foreground">Express checkout</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 gap-2 text-sm font-medium"
          disabled={loading !== null}
          onClick={() => handleExpressPayment("apple")}
        >
          <ApplePayIcon className="size-5" />
          {loading === "apple" ? "Redirecting…" : "Apple Pay"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 gap-2 text-sm font-medium"
          disabled={loading !== null}
          onClick={() => handleExpressPayment("google")}
        >
          <GooglePayIcon className="size-5" />
          {loading === "google" ? "Redirecting…" : "Google Pay"}
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue below</span>
        <Separator className="flex-1" />
      </div>
    </div>
  )
}
