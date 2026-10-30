import 'server-only'
import { CommerceError, type PaymentProvider, type PaymentWebhookEvent } from '@prood/types'
import { StripePaymentProvider } from '@prood/payment-stripe'
import { EasypayPaymentProvider } from '@prood/payment-easypay'
import { IfthenpayPaymentProvider } from '@prood/payment-ifthenpay'
import {
  getTenantIntegrationConfig,
  isPaymentProviderId,
  listTenantPaymentProviders,
  type PaymentProviderId,
} from './integrations'

/** A store's stored credentials for one provider, keyed by field. */
export type PaymentProviderConfig = Record<string, string>

function required(config: PaymentProviderConfig, key: string, provider: string): string {
  const value = config[key]
  if (!value) {
    throw new CommerceError(`${provider} is missing "${key}". Reconnect it in Integrations.`, 'VALIDATION', 422)
  }
  return value
}

function instantiate(id: PaymentProviderId, config: PaymentProviderConfig): PaymentProvider {
  switch (id) {
    case 'stripe':
      return new StripePaymentProvider({
        secretKey: required(config, 'secretKey', 'Stripe'),
        webhookSecret: config.webhookSecret,
      })
    case 'easypay':
      return new EasypayPaymentProvider({
        accountId: required(config, 'accountId', 'Easypay'),
        apiKey: required(config, 'apiKey', 'Easypay'),
        baseUrl: config.baseUrl,
      })
    case 'ifthenpay':
      return new IfthenpayPaymentProvider({
        antiPhishingKey: required(config, 'antiPhishingKey', 'Ifthenpay'),
        mbKey: config.mbKey,
        mbWayKey: config.mbWayKey,
        ccKey: config.ccKey,
      })
  }
}

export interface TenantPaymentProvider {
  id: PaymentProviderId
  provider: PaymentProvider
  config: PaymentProviderConfig
}

/**
 * Build the payment provider bound to a store's own gateway account.
 *
 * Payments always settle into the merchant's account, so there is no
 * platform-level fallback: a store without the provider connected gets a
 * validation error. When `providerId` is omitted, the store's first connected
 * provider is used.
 */
export async function getTenantPaymentProvider(
  tenantId: string,
  providerId?: string,
): Promise<TenantPaymentProvider> {
  const id = providerId ?? (await listTenantPaymentProviders(tenantId))[0]
  if (!id) {
    throw new CommerceError('This store has no payment provider connected yet.', 'VALIDATION', 422)
  }
  if (!isPaymentProviderId(id)) {
    throw new CommerceError(`Unknown payment provider "${id}".`, 'VALIDATION', 422)
  }
  const config = await getTenantIntegrationConfig(tenantId, id)
  if (!config) {
    throw new CommerceError(`${id} is not connected for this store.`, 'VALIDATION', 422)
  }
  return { id, provider: instantiate(id, config), config }
}

/** Verify a webhook against the store's own credentials and normalize it. */
export async function verifyPaymentWebhook(
  payload: string | Uint8Array,
  signature: string,
  providerId: string,
  tenantId: string,
): Promise<PaymentWebhookEvent> {
  const { provider } = await getTenantPaymentProvider(tenantId, providerId)
  if (!provider.verifyWebhook) {
    throw new Error(`Provider '${provider.id}' does not support webhook verification`)
  }
  return provider.verifyWebhook(payload, signature)
}
