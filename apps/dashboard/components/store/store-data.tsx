"use client"

import { useState } from "react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { authClient } from "@/lib/auth/client"
import { listStoreDomainsAction, removeDeletedStoreDomainsAction } from "@/app/(dashboard)/settings/actions"

/** Taking a store's data with you, and deleting the store. The export is open to owners and admins, the deletion to owners. */
export function StoreData({
  storeId,
  storeName,
  canDelete,
}: {
  storeId: string
  storeName: string
  canDelete: boolean
}) {
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function deleteStore(): Promise<boolean> {
    setError(null)
    if (typed.trim() !== storeName) {
      setError("Type the store's name exactly as it is shown to confirm.")
      return false
    }
    const domains = await listStoreDomainsAction()
    const { error: failure } = await authClient.organization.delete({ organizationId: storeId })
    if (failure) {
      setError(failure.message ?? "We couldn't delete the store. Nothing was changed.")
      return false
    }
    await removeDeletedStoreDomainsAction(domains)
    window.location.assign("/")
    return true
  }

  return (
    <>
      <Panel
        title="Your store's data"
        description="One JSON file with your settings, products, categories, customers and addresses, orders with their items and history, returns and reviews. It leaves out your payment provider credentials. Use it to move to another platform or to answer a request from a customer."
      >
        <Button asChild variant="outline">
          <a href={"/api/export/store"} download>
            Download store data
          </a>
        </Button>
      </Panel>
      {canDelete ? (
        <DangerZone
          title="Delete this store"
          description="Removes the store, its products, orders, customers and settings, its address and your payment provider credentials, now. Cancel a paid plan first. Download your data before you do this."
          action={
            <ConfirmAction
              label="Delete store"
              variant="destructive"
              title={`Delete ${storeName}?`}
              description="This can't be undone. Backups age out on our database provider's schedule."
              confirmLabel="Delete store"
              onConfirm={deleteStore}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-store-name">Type the store&apos;s name to confirm</Label>
                <Input
                  id="delete-store-name"
                  autoComplete="off"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                />
                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            </ConfirmAction>
          }
        />
      ) : null}
    </>
  )
}
