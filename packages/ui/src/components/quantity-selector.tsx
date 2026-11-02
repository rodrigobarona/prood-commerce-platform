"use client"

import { MinusIcon, PlusIcon } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { cn } from "@prood/ui/lib/utils"

export interface QuantitySelectorProps {
  value: number
  min?: number
  max?: number
  disabled?: boolean
  size?: "default" | "lg"
  onChange: (quantity: number) => void
  className?: string
}

const SIZES = {
  default: { step: "size-9", value: "w-8" },
  lg: { step: "size-12", value: "w-9" },
}

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  disabled = false,
  size = "default",
  onChange,
  className,
}: QuantitySelectorProps) {
  const { step, value: width } = SIZES[size]

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={cn(
        "border-input inline-flex w-fit items-center rounded-lg border transition-colors",
        disabled && "border-border text-muted-foreground",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(step, "rounded-[inherit]")}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </Button>
      <span aria-live="polite" className={cn(width, "text-center text-sm tabular-nums")}>
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(step, "rounded-[inherit]")}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
