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
    expect(list).toHaveBeenCalledWith({ limit: 1 }, expect.anything())
  })

  it('gives up after ten seconds, without retrying', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    await provider({}, list).checkCredentials()
    expect(list).toHaveBeenCalledWith(expect.anything(), { timeout: 10_000, maxNetworkRetries: 0 })
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

describe('createSession', () => {
  it("doesn't let extra metadata claim another order", async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cs_1', created: 1, status: 'open' })
    const client = { checkout: { sessions: { create } } } as unknown as Stripe

    await new StripePaymentProvider({ secretKey, client }).createSession({
      amount: 24.9,
      currency: 'EUR',
      orderId: 'order-1',
      customerId: 'customer-1',
      returnUrl: 'https://checkout.example/confirm/s1',
      metadata: { orderId: 'order-2', customerId: 'customer-2', note: 'kept' },
    })

    expect(create.mock.calls[0]?.[0].metadata).toEqual({
      orderId: 'order-1',
      customerId: 'customer-1',
      note: 'kept',
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

describe('verifyWebhook', () => {
  function refundWebhook(charge: Record<string, unknown>, sessions: unknown[]) {
    const event = { type: 'charge.refunded', data: { object: charge } }
    const list = vi.fn().mockResolvedValue({ data: sessions })
    const client = {
      checkout: { sessions: { list } },
      webhooks: { constructEventAsync: vi.fn().mockResolvedValue(event) },
    } as unknown as Stripe
    return { stripe: new StripePaymentProvider({ secretKey, webhookSecret, client }), list }
  }

  const charge = { id: 'ch_1', payment_intent: 'pi_1', currency: 'eur', amount: 2490, amount_refunded: 2490, refunded: true }
  const session = { id: 'cs_1', metadata: { orderId: 'order-1' } }

  it('finds the order behind a refund made in the Stripe dashboard', async () => {
    const { stripe, list } = refundWebhook(charge, [session])

    await expect(stripe.verifyWebhook('{}', 'sig')).resolves.toMatchObject({
      type: 'payment.refunded',
      sessionId: 'cs_1',
      orderId: 'order-1',
      amount: 24.9,
      currency: 'EUR',
    })
    expect(list).toHaveBeenCalledWith({ payment_intent: 'pi_1', limit: 1 })
  })

  it('tells a partial refund from a full one', async () => {
    const { stripe } = refundWebhook({ ...charge, amount_refunded: 500, refunded: false }, [session])
    await expect(stripe.verifyWebhook('{}', 'sig')).resolves.toMatchObject({
      type: 'payment.partially_refunded',
      amount: 5,
    })
  })

  it('leaves a refund it cannot tie to an order unmatched', async () => {
    const { stripe } = refundWebhook(charge, [])
    await expect(stripe.verifyWebhook('{}', 'sig')).resolves.toMatchObject({ type: 'payment.refunded', orderId: null })
  })
})
