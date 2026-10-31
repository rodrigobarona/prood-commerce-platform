import Stripe from 'stripe'
import { describe, expect, it, vi } from 'vitest'
import { StripePaymentProvider } from '../stripe-provider.js'

const secretKey = 'sk_test_1234567890abcdef'
const publishableKey = 'pk_test_1234567890abcdef'
const webhookSecret = 'whsec_1234567890abcdef'

function provider(
  overrides: { secretKey?: string; publishableKey?: string; webhookSecret?: string } = {},
  list = vi.fn().mockResolvedValue({ data: [] }),
) {
  const client = { checkout: { sessions: { list } } } as unknown as Stripe
  return new StripePaymentProvider({ secretKey, publishableKey, webhookSecret, ...overrides, client })
}

describe('checkCredentials', () => {
  it('accepts keys Stripe accepts, with a read-only call', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    await expect(provider({}, list).checkCredentials()).resolves.toEqual({ ok: true })
    expect(list).toHaveBeenCalledWith({ limit: 1 })
  })

  it.each([
    ['a truncated secret key', { secretKey: 'sk_test_12' }, 'secretKey'],
    ['a publishable key in the secret field', { secretKey: publishableKey }, 'secretKey'],
    ['a secret key in the publishable field', { publishableKey: secretKey }, 'publishableKey'],
    ['a bad signing secret', { webhookSecret: 'whsec_x' }, 'webhookSecret'],
  ])('refuses %s without calling Stripe', async (_name, keys, field) => {
    const list = vi.fn()
    await expect(provider(keys, list).checkCredentials()).resolves.toEqual({ ok: false, reason: 'rejected', field })
    expect(list).not.toHaveBeenCalled()
  })

  it('refuses a test publishable key with a live secret key', async () => {
    await expect(provider({ secretKey: 'sk_live_1234567890abcdef' }).checkCredentials()).resolves.toEqual({
      ok: false,
      reason: 'mismatched',
      field: 'publishableKey',
    })
  })

  it('names the secret key when Stripe refuses it', async () => {
    const refused = new Stripe.errors.StripeAuthenticationError({ type: 'invalid_request_error', message: 'bad key' })
    await expect(provider({}, vi.fn().mockRejectedValue(refused)).checkCredentials()).resolves.toEqual({
      ok: false,
      reason: 'rejected',
      field: 'secretKey',
    })
  })

  it('reports an outage as unreachable, not as a bad key', async () => {
    await expect(provider({}, vi.fn().mockRejectedValue(new Error('ETIMEDOUT'))).checkCredentials()).resolves.toEqual({
      ok: false,
      reason: 'unreachable',
    })
  })
})

describe('refund', () => {
  it('refunds the payment behind the session, idempotently', async () => {
    const session = { id: 'cs_1', status: 'complete', payment_status: 'paid', payment_intent: 'pi_1', currency: 'eur', created: 1 }
    const create = vi.fn().mockResolvedValue({})
    const retrieve = vi.fn().mockResolvedValue(session)
    const client = { checkout: { sessions: { retrieve } }, refunds: { create } } as unknown as Stripe
    const stripe = new StripePaymentProvider({ secretKey, client })

    await stripe.refund({ sessionId: 'cs_1', amount: 24.9, idempotencyKey: 'refund-order-1' })

    expect(create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1', amount: 2490 },
      { idempotencyKey: 'refund-order-1' },
    )
  })

  it('needs no read after the refund, so a failed read cannot report it as failed', async () => {
    const session = { id: 'cs_1', status: 'complete', payment_status: 'paid', payment_intent: 'pi_1', currency: 'eur', created: 1 }
    const retrieve = vi.fn().mockResolvedValueOnce(session).mockRejectedValue(new Error('ETIMEDOUT'))
    const client = {
      checkout: { sessions: { retrieve } },
      refunds: { create: vi.fn().mockResolvedValue({}) },
    } as unknown as Stripe

    await new StripePaymentProvider({ secretKey, client }).refund({ sessionId: 'cs_1' })

    expect(retrieve).toHaveBeenCalledOnce()
  })
})
