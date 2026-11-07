"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Checkbox } from "@prood/ui/components/checkbox"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Label } from "@prood/ui/components/label"
import { eraseCustomerAction } from "@/app/(dashboard)/customers/actions"

/** Answering a customer's request to be erased (GDPR Art. 17). Orders stay unless the merchant also clears them. */
export function EraseCustomerSection({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [scrubOrders, setScrubOrders] = useState(false)

  async function handleErase(): Promise<boolean> {
    const { error } = await eraseCustomerAction(customerId, scrubOrders)
    if (error) {
      toast.error(error)
      return false
    }
    toast.success("Customer erased.")
    router.push("/customers")
    router.refresh()
    return true
  }

  return (
    <DangerZone
      title="Erase this customer"
      description="Removes their profile, saved addresses, wishlist and open carts. Their orders stay in your records, without a link to them. Do this when they ask you to erase their data."
      action={
        <ConfirmAction
          label="Erase customer"
          variant="destructive"
          title="Erase this customer?"
          description="You can't undo this. Their orders stay in your records, because you may need them for your accounts."
          confirmLabel="Erase customer"
          onConfirm={handleErase}
        >
          <div className="flex items-start gap-3">
            <Checkbox id="scrub-orders" checked={scrubOrders} onCheckedChange={(value) => setScrubOrders(value === true)} />
            <Label htmlFor="scrub-orders" className="font-normal leading-snug">
              Also clear their email, addresses and notes from their orders. Totals, items and dates stay.
            </Label>
          </div>
        </ConfirmAction>
      }
    />
  )
}
