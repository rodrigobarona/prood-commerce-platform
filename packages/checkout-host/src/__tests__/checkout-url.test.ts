import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { paymentWebhookUrl, resolveCheckoutBaseUrl } from '@prood/commerce'
import { buildCheckoutSessionUrl } from '../checkout-url'

// CHECKOUT_URL is the public base including its path (https://prood.com/pay), so
// every URL is that string with the route appended: never resolved against it.
describe('URLs built from CHECKOUT_URL', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('keeps the base path on the payment page, the return URL and the webhook URL', () => {
    vi.stubEnv('CHECKOUT_URL', 'https://prood.com/pay/')

    const base = resolveCheckoutBaseUrl()

    expect(base).toBe('https://prood.com/pay')
    expect(buildCheckoutSessionUrl(base, 'cs_1')).toBe('https://prood.com/pay/c/cs_1')
    expect(`${base}/confirm/cs_1`).toBe('https://prood.com/pay/confirm/cs_1')
    expect(paymentWebhookUrl('stripe', 'org 1')).toBe('https://prood.com/pay/api/webhooks/stripe/org%201')
  })

  it('fails loudly without CHECKOUT_URL', () => {
    vi.stubEnv('CHECKOUT_URL', '')
    expect(() => resolveCheckoutBaseUrl()).toThrow('CHECKOUT_URL is required')
  })
})
