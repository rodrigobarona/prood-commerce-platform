"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash } from "@phosphor-icons/react"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { deleteProductAction } from "@/app/(dashboard)/products/actions"

export function DeleteProductSection({ productId }: { productId: string }) {
  const router = useRouter()

  async function handleDelete() {
    try {
      await deleteProductAction(productId)
      toast.success("Product deleted.")
      router.push("/products")
      router.refresh()
      return true
    } catch {
      toast.error("We couldn't delete this product. Nothing changed. Try again.")
      return false
    }
  }

  return (
    <DangerZone
      title="Delete product"
      description="It disappears from your catalog and your store. Orders that already include it keep their details."
      action={
        <ConfirmAction
          label={
            <>
              <Trash />
              <span>Delete product</span>
            </>
          }
          title="Delete this product?"
          description="It disappears from your catalog and your store. You can't undo this."
          confirmLabel="Delete product"
          onConfirm={handleDelete}
        />
      }
    />
  )
}
