"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { checkPaymentCredentials, isPaymentProviderId, revalidateStore } from "@prood/commerce"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"
import { listOrders } from "@/lib/admin-api"
import {
  deleteIntegration,
  getIntegration,
  listIntegrations,
  upsertIntegration,
} from "@/lib/integrations"
import {
  connectedMessage,
  credentialErrorMessage,
  getProvider,
  inSentence,
  providerDisplaced,
  providerInCharge,
} from "@/lib/providers"

export type SaveIntegrationResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

const integrationInput = z.tuple([
  z.string().max(40),
  z.record(z.string().max(60), z.string().max(4000)),
  z.boolean(),
])

// Returned, not thrown: Next.js hides thrown messages from the client in production.
export async function saveIntegrationAction(
  ...args: [provider: string, config: Record<string, string>, enabled: boolean]
): Promise<SaveIntegrationResult> {
  const parsed = integrationInput.safeParse(args)
  if (!parsed.success) return { ok: false, error: "We couldn't read those details. Reload the page and try again." }
  const [provider, config, enabled] = parsed.data
  const meta = getProvider(provider)
  if (!meta || !isPaymentProviderId(provider)) {
    return { ok: false, error: "We don't know that provider." }
  }

  if (!(await canManageStore())) return { ok: false, error: ADMIN_ONLY_MESSAGE }
  const orgId = await requireStoreAdmin()
  const existing = await getIntegration(orgId, provider)

  // Merge submitted values over existing config, keeping only known fields.
  // An empty secret keeps the stored value, because the form never echoes it
  // back. Other fields are echoed, so emptying an optional one clears it.
  const merged: Record<string, string> = {}
  for (const field of meta.fields) {
    const submitted = config[field.key]?.trim()
    const prior = existing?.config[field.key]
    const clears = submitted === "" && !field.required && field.type !== "password"
    const value = submitted || (clears ? undefined : prior)
    if (value) merged[field.key] = value
  }

  const missing = meta.fields.find((field) => field.required && !merged[field.key])
  if (missing) {
    return { ok: false, error: `Add your ${inSentence(missing.label)} to connect ${meta.name}.` }
  }

  // A store connecting a provider wants to sell through it.
  const isEnabled = existing ? enabled : true

  // Turning a provider off must work even if its keys have since stopped working.
  if (isEnabled) {
    const check = await checkPaymentCredentials(provider, merged)
    if (check && !check.ok) return { ok: false, error: credentialErrorMessage(meta, check) }
  }

  await upsertIntegration(orgId, provider, merged, isEnabled)
  // Whether the store takes orders, and how, is part of what the storefront caches.
  revalidateStore(orgId)
  revalidatePath("/integrations")
  revalidatePath(`/integrations/${provider}`)
  const integrations = await listIntegrations(orgId)
  const enabledIds = [...integrations].filter(([, state]) => state.enabled).map(([id]) => id)
  const displacedMeta = providerDisplaced(provider, enabledIds)
  const displaced = displacedMeta
    ? { meta: displacedMeta, config: integrations.get(displacedMeta.id)?.config ?? {} }
    : undefined
  return {
    ok: true,
    message: connectedMessage(meta, merged, isEnabled, providerInCharge(provider, enabledIds), displaced),
  }
}

/**
 * Refused while an order waits on the provider: its webhook is checked against
 * the credentials stored here, so without them that payment could never be recorded.
 */
export async function disconnectIntegrationAction(
  provider: string
): Promise<{ error?: string }> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }
  const orgId = await requireStoreAdmin()

  const { total } = await listOrders({ awaitingPaymentFrom: provider, perPage: 1 })
  if (total > 0) {
    return {
      error:
        `${total === 1 ? "An order is" : `${total} orders are`} still waiting for a payment through ` +
        `${getProvider(provider)?.name ?? provider}. Cancel ${total === 1 ? "it" : "them"} or wait for payment, then disconnect.`,
    }
  }

  await deleteIntegration(orgId, provider)
  revalidateStore(orgId)
  revalidatePath("/integrations")
  revalidatePath(`/integrations/${provider}`)
  return {}
}
