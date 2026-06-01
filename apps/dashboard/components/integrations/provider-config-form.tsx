"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Switch } from "@prood/ui/components/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import type { ProviderMeta } from "@/lib/providers"
import {
  disconnectIntegrationAction,
  saveIntegrationAction,
} from "@/app/(dashboard)/integrations/actions"

export function ProviderConfigForm({
  provider,
  initialValues,
  configuredKeys,
  initialEnabled,
  connected,
}: {
  provider: ProviderMeta
  initialValues: Record<string, string>
  configuredKeys: string[]
  initialEnabled: boolean
  connected: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [enabled, setEnabled] = useState(initialEnabled)

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        await saveIntegrationAction(provider.id, values, enabled)
        toast.success(`${provider.name} saved`)
        router.push("/integrations")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save")
      }
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectIntegrationAction(provider.id)
        toast.success(`${provider.name} disconnected`)
        router.push("/integrations")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not disconnect")
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="flex w-full flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {provider.fields.map((field) => {
            const isSetSecret =
              field.type === "password" && configuredKeys.includes(field.key)
            return (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  required={field.required && !isSetSecret}
                  placeholder={
                    isSetSecret
                      ? "•••••••• (leave blank to keep)"
                      : field.placeholder
                  }
                  value={values[field.key] ?? ""}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              </div>
            )
          })}

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label htmlFor="enabled">Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Turn this integration on for your store.
              </p>
            </div>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        {connected ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/integrations")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
