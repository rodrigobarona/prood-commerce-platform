"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { DangerZone } from "@prood/ui/components/danger-zone"
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

/** The one thing an order is waiting for, in the page header. */
export function FulfillOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [fulfillNote, setFulfillNote] = useState("")

  function handleFulfill() {
    startTransition(async () => {
      try {
        await fulfillOrderAction(orderId, {
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          note: fulfillNote || undefined,
        })
        toast.success("Order fulfilled.")
        router.refresh()
      } catch {
        toast.error("We couldn't fulfill this order. Nothing changed. Try again.")
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">Fulfill order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fulfill order</DialogTitle>
          <DialogDescription>
            Add tracking so the customer can follow the parcel. All of this is optional.
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
            <Button variant="ghost">Go back</Button>
          </DialogClose>
          <Button disabled={pending} onClick={handleFulfill}>
            {pending ? "Fulfilling..." : "Fulfill order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** What can't be undone, kept apart from the work at the foot of the page. */
export function OrderDangerZone({
  orderId,
  canCancel,
  partlyRefunded,
  refund,
  refundAmount,
}: {
  orderId: string
  canCancel: boolean
  /** There's no refund to offer on such an order, so the money has to be sorted out elsewhere. */
  partlyRefunded: boolean
  refund: "provider" | "manual" | null
  refundAmount: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [refundNote, setRefundNote] = useState("")
  const [cancelNote, setCancelNote] = useState("")

  function handleRefund(recordOnly: boolean) {
    startTransition(async () => {
      try {
        const result = await refundOrderAction(orderId, {
          note: refundNote || undefined,
          recordOnly,
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success(
          recordOnly
            ? `Refund of ${refundAmount} recorded.`
            : `Refund of ${refundAmount} sent to the customer.`
        )
        router.refresh()
      } catch {
        toast.error("We couldn't refund this order. Nothing changed. Try again.")
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      try {
        const { error } = await cancelOrderAction(orderId, cancelNote || undefined)
        if (error) {
          toast.error(error)
          router.refresh()
          return
        }
        toast.success("Order canceled.")
        router.refresh()
      } catch {
        toast.error("We couldn't cancel this order. Nothing changed. Try again.")
      }
    })
  }

  if (!canCancel && !refund) return null

  return (
    <DangerZone
      title={canCancel && refund ? "Cancel or refund this order" : canCancel ? "Cancel this order" : "Refund this order"}
      description={`You can't undo ${canCancel && refund ? "either one" : "this"}. The customer sees the change on their order.`}
      action={
        <div className="flex flex-wrap gap-2">
          {canCancel ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Cancel order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel order</DialogTitle>
                  <DialogDescription>
                    {partlyRefunded
                      ? "The order will be marked as canceled. This doesn't refund the customer. Refund what's left in your payment account first."
                      : "The order will be marked as canceled. This doesn't refund the customer. If they've paid, use Refund order instead."}{" "}
                    You can&apos;t undo this.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cancelNote">Reason (optional)</Label>
                  <Textarea
                    id="cancelNote"
                    rows={2}
                    placeholder="Customer asked to cancel"
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
          {refund ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {refund === "manual" ? "Record refund" : "Refund order"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {refund === "manual" ? "Record refund" : "Refund order"}
                  </DialogTitle>
                  <DialogDescription>
                    {refund === "manual"
                      ? `Prood can't send this refund. Refund ${refundAmount} in your payment account first, then record it here.`
                      : `This sends ${refundAmount} back to the customer through your payment provider, cancels the order and emails them. Already refunded it in your payment account? Record it instead, and no money moves.`}
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
                    <Button variant="ghost">Go back</Button>
                  </DialogClose>
                  {refund === "provider" ? (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleRefund(true)}
                    >
                      Record refund
                    </Button>
                  ) : null}
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => handleRefund(refund === "manual")}
                  >
                    {pending
                      ? "Refunding..."
                      : refund === "manual"
                        ? "Record refund"
                        : `Refund ${refundAmount}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      }
    />
  )
}
