"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@prood/ui/components/accordion"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { CopyBlock } from "@prood/ui/components/copy-block"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { DetailLayout } from "@prood/ui/components/page-layout"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import { Switch } from "@prood/ui/components/switch"
import { inSentence, type ProviderField, type ProviderMeta } from "@/lib/providers"
import { integrationStatus } from "@/lib/status"
import {
  disconnectIntegrationAction,
  saveIntegrationAction,
} from "@/app/(dashboard)/payments/actions"

/** A saved secret is never sent to the browser, so it shows as dots until it's replaced. */
function SavedSecret({
  field,
  value,
  onChange,
}: {
  field: ProviderField
  value: string
  onChange: (value: string) => void
}) {
  const [replacing, setReplacing] = useState(false)
  const name = field.label.toLowerCase()

  if (!replacing) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm leading-none font-medium">{field.label}</p>
        <div className="flex h-9 items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 pr-1 pl-3">
          <span className="truncate font-mono text-sm tracking-widest text-muted-foreground">
            <span aria-hidden>••••••••••••••••</span>
            <span className="sr-only">Saved</span>
          </span>
          <Button type="button" variant="ghost" size="sm" aria-label={`Replace ${name}`} onClick={() => setReplacing(true)}>
            Replace
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key}>New {name}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={field.key}
          type="password"
          required
          autoFocus
          autoComplete="off"
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="lg"
          aria-label={`Keep saved ${name}`}
          onClick={() => {
            onChange("")
            setReplacing(false)
          }}
        >
          Keep saved
        </Button>
      </div>
    </div>
  )
}

/** Opens on request: what most merchants never need to touch. */
function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Accordion type="single" collapsible className="rounded-lg">
      <AccordionItem value="more">
        <AccordionTrigger className="px-3 py-2.5">{title}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 pt-1">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function ProviderConfigForm({
  provider,
  initialValues,
  configuredKeys,
  initialEnabled,
  connected,
  webhookUrl,
}: {
  provider: Pick<ProviderMeta, "id" | "name" | "fields" | "webhook" | "guide">
  initialValues: Record<string, string>
  configuredKeys: string[]
  initialEnabled: boolean
  connected: boolean
  webhookUrl: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saves, setSaves] = useState(0)
  const [missing, setMissing] = useState<string[]>([])

  const { guide } = provider
  const stepFields = guide.steps.flatMap((step) => step.fields ?? [])
  const advanced = provider.fields.filter((field) => !stepFields.includes(field.key))
  const changed =
    enabled !== initialEnabled ||
    provider.fields.some((field) => (values[field.key] ?? "") !== (initialValues[field.key] ?? ""))

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setMissing((prev) => prev.filter((candidate) => candidate !== key))
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const empty = provider.fields
      .filter((field) => field.required && !configuredKeys.includes(field.key) && !values[field.key]?.trim())
      .map((field) => field.key)
    setMissing(empty)
    if (empty[0]) {
      document.getElementById(empty[0])?.focus()
      return
    }
    startTransition(async () => {
      try {
        const result = await saveIntegrationAction(provider.id, values, enabled)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        // The router keeps this page alive behind the list, so a typed secret mustn't stay in it.
        setValues(initialValues)
        setSaves((count) => count + 1)
        toast.success(result.message)
        router.push("/payments")
        router.refresh()
      } catch {
        toast.error(`We couldn't save ${provider.name}. Nothing changed. Try again.`)
      }
    })
  }

  async function handleDisconnect() {
    try {
      const { error } = await disconnectIntegrationAction(provider.id)
      if (error) {
        toast.error(error)
        return false
      }
      toast.success(`${provider.name} disconnected.`)
      router.push("/payments")
      router.refresh()
      return true
    } catch {
      toast.error(`We couldn't disconnect ${provider.name}. Nothing changed. Try again.`)
      return false
    }
  }

  function renderField(field: ProviderField) {
    if (field.type === "password" && configuredKeys.includes(field.key)) {
      return (
        <SavedSecret
          key={`${field.key}-${saves}`}
          field={field}
          value={values[field.key] ?? ""}
          onChange={(value) => set(field.key, value)}
        />
      )
    }
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Input
          id={field.key}
          type={field.type}
          autoComplete="off"
          placeholder={field.placeholder}
          aria-invalid={missing.includes(field.key) ? true : undefined}
          aria-describedby={
            missing.includes(field.key) ? `${field.key}-error` : field.hint ? `${field.key}-hint` : undefined
          }
          value={values[field.key] ?? ""}
          onChange={(event) => set(field.key, event.target.value)}
        />
        {missing.includes(field.key) ? (
          <p id={`${field.key}-error`} className="text-xs text-destructive">
            Add your {inSentence(field.label)} to connect {provider.name}.
          </p>
        ) : null}
        {field.hint ? (
          <p id={`${field.key}-hint`} className="text-xs text-muted-foreground">
            {field.hint}
          </p>
        ) : null}
      </div>
    )
  }

  const lastStep = guide.steps.length - 1

  return (
    <>
      <form onSubmit={handleSave} noValidate>
        <DetailLayout
          main={guide.steps.map((step, index) => {
            const last = index === lastStep
            const fields = provider.fields.filter((field) => step.fields?.includes(field.key))
            const showWebhook = step.webhook && webhookUrl
            const empty = fields.length === 0 && !showWebhook && !(last && (connected || advanced.length > 0))
            return (
              <Panel
                key={step.title}
                title={`${index + 1}. ${step.title}`}
                description={step.body}
                flush={empty}
                footer={
                  last ? (
                    <Button type="submit" disabled={pending || (connected && !changed)}>
                      {pending
                        ? `Testing ${provider.name}...`
                        : connected
                          ? "Save changes"
                          : `Connect ${provider.name}`}
                    </Button>
                  ) : undefined
                }
              >
                {empty ? null : (
                  <div className="flex flex-col gap-4">
                    {fields.map(renderField)}
                    {showWebhook ? (
                      <>
                        {provider.webhook.events ? (
                          <Disclosure title="Events to select">
                            <CopyBlock value={provider.webhook.events.join("\n")} label="event names" />
                          </Disclosure>
                        ) : null}
                        <CopyBlock value={webhookUrl} label="address" />
                      </>
                    ) : null}
                    {last && advanced.length > 0 ? (
                      <Disclosure title="Advanced">{advanced.map(renderField)}</Disclosure>
                    ) : null}
                    {last && connected ? (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label htmlFor="enabled">Turned on</Label>
                          <p className="mt-1 text-xs text-pretty text-muted-foreground">
                            Turn this off to stop using {provider.name}.
                          </p>
                        </div>
                        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                      </div>
                    ) : null}
                  </div>
                )}
              </Panel>
            )
          })}
          aside={
            <>
              {connected ? null : (
                <Panel title="What you'll need">
                  <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-pretty">
                    {guide.need.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Panel>
              )}
              <Panel title="Status" description="Checkout uses one provider at a time: Stripe first, then Easypay, then Ifthenpay.">
                <FactList>
                  <Fact label="Connection">
                    <Status look={integrationStatus(connected ? { enabled: initialEnabled } : null)} />
                  </Fact>
                </FactList>
              </Panel>
              <Panel title="Test it first">
                <ol className="flex list-decimal flex-col gap-2 pl-4 text-sm text-pretty">
                  {guide.test.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </Panel>
            </>
          }
        />
      </form>

      {connected ? (
        <DangerZone
          title={`Disconnect ${provider.name}`}
          description={`Your saved keys are deleted, and customers can't pay with ${provider.name}. To pause it for a while, turn it off instead.`}
          action={
            <ConfirmAction
              label={`Disconnect ${provider.name}`}
              title={`Disconnect ${provider.name}?`}
              description={`Your saved keys are deleted, and customers can't pay with ${provider.name} until you connect it again.`}
              confirmLabel={`Disconnect ${provider.name}`}
              onConfirm={handleDisconnect}
            />
          }
        />
      ) : null}
    </>
  )
}
