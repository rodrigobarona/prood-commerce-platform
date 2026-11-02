"use client"

import { startTransition, useActionState, useRef, type FormEvent } from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { Checkbox } from "@prood/ui/components/checkbox"
import { CopyBlock } from "@prood/ui/components/copy-block"
import { FieldError } from "@prood/ui/components/field"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { ADMIN_SCOPE_NEEDS_GROW } from "@/lib/api-key-copy"
import { createApiKeyAction, type ApiKeyActionState } from "./actions"

const initialState: ApiKeyActionState = {}

/** Empty, not disabled: the kit's default fill reads as switched off on a card. */
const CHECKBOX = "mt-0.5 border-input bg-card"

export function ApiKeyCreateForm({ adminAllowed, agentAuthAllowed }: { adminAllowed: boolean; agentAuthAllowed: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const storefrontRef = useRef<HTMLButtonElement>(null)

  async function create(previous: ApiKeyActionState, formData: FormData) {
    let result: ApiKeyActionState
    try {
      result = await createApiKeyAction(previous, formData)
    } catch {
      return { error: "We couldn't create this key. Nothing changed. Try again." }
    }
    if (result.nameError) nameRef.current?.focus()
    else if (result.scopesError) storefrontRef.current?.focus()
    if (result.key) formRef.current?.reset()
    return result
  }

  const [state, formAction, pending] = useActionState(create, initialState)

  /** Not `<form action>`: React resets those when the action returns, so a failure would clear the form. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <Panel
        title="Create a key"
        description={`For your own code. AI agents should connect through Agent Auth, so you approve their access.${agentAuthAllowed ? "" : " Agent Auth starts on Grow."}`}
        footer={
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create API key"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex max-w-sm flex-col gap-1.5">
            <Label htmlFor="api-key-name">Key name</Label>
            <Input
              ref={nameRef}
              id="api-key-name"
              name="name"
              placeholder="Production integration"
              aria-invalid={state.nameError ? true : undefined}
              aria-describedby={state.nameError ? "api-key-name-error" : undefined}
            />
            <FieldError id="api-key-name-error" className="text-xs">
              {state.nameError}
            </FieldError>
          </div>

          <fieldset className="flex flex-col gap-3" aria-describedby={state.scopesError ? "api-key-scopes-error" : undefined}>
            <legend className="mb-1 text-sm font-medium">Scopes</legend>
            <div className="flex items-start gap-2">
              <Checkbox
                ref={storefrontRef}
                id="scope-storefront"
                name="scopes"
                value="storefront"
                defaultChecked
                aria-describedby="scope-storefront-hint"
                className={CHECKBOX}
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="scope-storefront">Storefront</Label>
                <p id="scope-storefront-hint" className="text-sm text-pretty text-muted-foreground">
                  Browse products, fill a cart and place an order.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="scope-admin"
                name="scopes"
                value="admin"
                disabled={!adminAllowed}
                aria-describedby="scope-admin-hint"
                className={CHECKBOX}
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="scope-admin" className={adminAllowed ? undefined : "text-muted-foreground"}>
                  Admin
                </Label>
                <p id="scope-admin-hint" className="text-sm text-pretty text-muted-foreground">
                  {adminAllowed
                    ? "Reads and changes catalog, inventory, orders and store settings, and reads customers. Payment accounts, domains, team and keys stay in the dashboard."
                    : ADMIN_SCOPE_NEEDS_GROW}
                </p>
              </div>
            </div>
            <FieldError id="api-key-scopes-error" className="text-xs">
              {state.scopesError}
            </FieldError>
          </fieldset>

          {adminAllowed ? (
            <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-pretty">
              <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                An admin key isn&apos;t Agent Auth. Anything holding it can change your store without asking you,
                so keep it on your own server and out of AI agents.
              </span>
            </p>
          ) : null}

          {state.error ? (
            <p role="alert" className="text-sm text-pretty text-destructive">
              {state.error}
            </p>
          ) : null}
          {state.key ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
              <p role="status" className="font-medium">
                Copy this key now. We won&apos;t show it again.
              </p>
              <CopyBlock value={state.key} label="API key" />
            </div>
          ) : null}
        </div>
      </Panel>
    </form>
  )
}
