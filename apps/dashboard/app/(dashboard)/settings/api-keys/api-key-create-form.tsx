"use client"

import { useActionState } from "react"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { createApiKeyAction, type ApiKeyActionState } from "./actions"

const initialState: ApiKeyActionState = {}

export function ApiKeyCreateForm() {
  const [state, formAction, pending] = useActionState(createApiKeyAction, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border p-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="api-key-name">
          Key name
        </label>
        <Input
          id="api-key-name"
          name="name"
          placeholder="Production integration"
          required
        />
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Scopes</legend>
        <label className="flex items-center gap-2 text-sm">
          <input name="scopes" type="checkbox" value="storefront" defaultChecked />
          Storefront
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="scopes" type="checkbox" value="admin" />
          Admin
        </label>
      </fieldset>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.key ? (
        <div className="rounded-xl bg-muted p-3 text-sm">
          <p className="font-medium">Copy this key now. It will not be shown again.</p>
          <code className="mt-2 block break-all">{state.key}</code>
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create API key"}
      </Button>
    </form>
  )
}
