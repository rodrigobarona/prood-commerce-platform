"use client"

import { useState, useTransition, type ComponentProps, type ReactNode } from "react"
import { unstable_rethrow } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@prood/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@prood/ui/components/dialog"

/**
 * A button that asks before it does something hard to undo. Pass `trigger` for
 * a button of your own, like an icon in a table row.
 */
export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  variant = "outline",
  size,
  className,
  disabled,
  trigger,
  onConfirm,
  children,
}: {
  label?: ReactNode
  title: string
  description: string
  confirmLabel: string
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
  disabled?: boolean
  trigger?: ReactNode
  /** Resolves true when the action worked, which closes the dialog. */
  onConfirm: () => Promise<boolean>
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      // A rejected action must not reach the error boundary and take the page with it. A redirect still goes through.
      try {
        if (await onConfirm()) setOpen(false)
      } catch (err) {
        unstable_rethrow(err)
        toast.error("We couldn't do that. Nothing changed. Try again.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={variant} size={size} className={className} disabled={disabled}>
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Keep as is
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
