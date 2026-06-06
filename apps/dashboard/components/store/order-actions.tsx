"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Textarea } from "@prood/ui/components/textarea"
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
import {
  fulfillOrderAction,
  refundOrderAction,
  cancelOrderAction,
} from "@/app/(dashboard)/orders/actions"

export function OrderActions({
  orderId,
  canFulfill,
  canCancel,
  canRefund,
}: {
  orderId: string
  canFulfill: boolean
  canCancel: boolean
  canRefund: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [fulfillNote, setFulfillNote] = useState("")
  const [refundNote, setRefundNote] = useState("")
  const [cancelNote, setCancelNote] = useState("")

  function handleFulfill() {
    startTransition(async () => {
      try {
        await fulfillOrderAction(orderId, {
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          note: fulfillNote || undefined,
        })
        toast.success("Order fulfilled")
        router.refresh()
      } catch {
        toast.error("Could not fulfill order")
      }
    })
  }

  function handleRefund() {
    startTransition(async () => {
      try {
        await refundOrderAction(orderId, refundNote || undefined)
        toast.success("Order refunded")
        router.refresh()
      } catch {
        toast.error("Could not refund order")
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelOrderAction(orderId, cancelNote || undefined)
        toast.success("Order cancelled")
        router.refresh()
      } catch {
        toast.error("Could not cancel order")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {canFulfill ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Fulfill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fulfill order</DialogTitle>
              <DialogDescription>
                Add tracking details and mark this order as shipped.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trackingNumber">Tracking number</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trackingUrl">Tracking URL</Label>
                <Input
                  id="trackingUrl"
                  value={trackingUrl}
                  onChange={(event) => setTrackingUrl(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fulfillNote">Note</Label>
                <Textarea
                  id="fulfillNote"
                  rows={2}
                  value={fulfillNote}
                  onChange={(event) => setFulfillNote(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button disabled={pending} onClick={handleFulfill}>
                {pending ? "Fulfilling..." : "Fulfill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {canCancel ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Cancel order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel order</DialogTitle>
              <DialogDescription>
                This will mark the order as cancelled. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cancelNote">Reason (optional)</Label>
              <Textarea
                id="cancelNote"
                rows={2}
                placeholder="Customer requested cancellation..."
                value={cancelNote}
                onChange={(event) => setCancelNote(event.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Keep order</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={handleCancel}
              >
                {pending ? "Cancelling..." : "Cancel order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {canRefund ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Refund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund order</DialogTitle>
              <DialogDescription>
                This marks the order as refunded and initiates the refund with
                the payment provider.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="refundNote">Note (optional)</Label>
              <Textarea
                id="refundNote"
                rows={2}
                value={refundNote}
                onChange={(event) => setRefundNote(event.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={handleRefund}
              >
                {pending ? "Refunding..." : "Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
