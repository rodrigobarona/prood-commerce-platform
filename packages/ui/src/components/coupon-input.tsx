"use client"

import { useState } from "react"
import { XIcon } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { cn } from "@prood/ui/lib/utils"

export interface CouponInputProps {
  appliedCode?: string | null
  loading?: boolean
  error?: string | null
  onApply: (code: string) => void
  onRemove?: () => void
  className?: string
}

export function CouponInput({
  appliedCode,
  loading = false,
  error,
  onApply,
  onRemove,
  className,
}: CouponInputProps) {
  const [code, setCode] = useState("")

  if (appliedCode) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center justify-between rounded-2xl border px-3 py-2">
          <span className="text-sm">
            Coupon <span className="font-medium">{appliedCode}</span>{error ? null : " applied"}
          </span>
          {onRemove ? (
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove coupon">
              <XIcon />
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-1", className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (code.trim()) onApply(code.trim())
      }}
    >
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          disabled={loading}
        />
        <Button type="submit" variant="outline" disabled={loading || !code.trim()}>
          Apply
        </Button>
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </form>
  )
}
