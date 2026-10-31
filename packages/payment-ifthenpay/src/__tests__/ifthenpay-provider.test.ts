import { describe, expect, it, vi } from 'vitest'
import { decodeOrderId, encodeOrderId, IfthenpayPaymentProvider } from '../ifthenpay-provider.js'

const orderId = '7f3c1e52-9a4b-4d6e-8f01-2b3c4d5e6f70'
const keys = { antiPhishingKey: 'secret', mbKey: 'MB-1', mbWayKey: 'MW-1', ccKey: 'CC-1' }
const input = { amount: 24.9, currency: 'EUR', orderId, returnUrl: 'https://pay.example/confirm/1' }

function mockFetch(body: unknown) {
  const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)))
  vi.stubGlobal('fetch', fn)
  return fn
}

const sentBody = (fn: ReturnType<typeof vi.fn>) =>
  JSON.parse((fn.mock.calls[0]?.[1] as RequestInit).body as string) as Record<string, any>

describe('methods', () => {
  it('offers only what the store has a key for', () => {
    expect(new IfthenpayPaymentProvider({ antiPhishingKey: 'x', mbKey: 'a' }).methods).toEqual(['multibanco'])
    expect(new IfthenpayPaymentProvider(keys).methods).toEqual(['multibanco', 'mbway', 'card'])
  })

  it('has no refund to call', () => {
    const provider = new IfthenpayPaymentProvider(keys)
    expect('refund' in provider).toBe(false)
    expect(provider.refundableMethods).toEqual([])
  })
})

describe('order ids', () => {
  it('fit Ifthenpay limit and survive the round trip', () => {
    expect(encodeOrderId(orderId).length).toBeLessThanOrEqual(25)
    expect(decodeOrderId(encodeOrderId(orderId))).toBe(orderId)
  })

  it('round-trips an id with leading zeros', () => {
    const small = '00000000-0000-4000-8000-000000000001'
    expect(decodeOrderId(encodeOrderId(small))).toBe(small)
  })

  it('leaves other ids alone', () => {
    expect(encodeOrderId('cart-123')).toBe('cart-123')
    expect(decodeOrderId('cart-123')).toBe('cart-123')
  })
})

describe('createSession', () => {
  it('asks for a dated Multibanco reference', async () => {
    const fetch = mockFetch({ Entity: '11111', Reference: '123456789', ExpiryDate: '03-11-2026', RequestId: 'r1', Status: '0' })

    const session = await new IfthenpayPaymentProvider(keys).createSession({ ...input, method: 'multibanco' })

    expect(sentBody(fetch)).toMatchObject({ orderId: encodeOrderId(orderId), expiryDays: 3 })
    expect(session).toMatchObject({
      id: 'r1',
      method: 'multibanco',
      providerData: { entity: '11111', reference: '123456789', expiresAt: '2026-11-03T23:59' },
    })
  })

  it('fails rather than show a blank reference', async () => {
    mockFetch({ Status: '999', Message: 'Invalid key' })
    await expect(new IfthenpayPaymentProvider(keys).createSession(input)).rejects.toThrow('Invalid key')
  })

  it('sends MB WAY with the country prefix Ifthenpay needs', async () => {
    const fetch = mockFetch({ RequestId: 'r1', Status: '000' })

    const session = await new IfthenpayPaymentProvider(keys).createSession({
      ...input,
      method: 'mbway',
      customer: { phone: '912 345 678' },
    })

    expect(sentBody(fetch)).toMatchObject({ mbWayKey: 'MW-1', mobileNumber: '351#912345678' })
    expect(session).toMatchObject({ method: 'mbway', status: 'pending' })
  })

  it('reports an MB WAY request Ifthenpay refused', async () => {
    mockFetch({ Status: '999', Message: 'Unknown number' })
    await expect(
      new IfthenpayPaymentProvider(keys).createSession({ ...input, method: 'mbway', customer: { phone: '912345678' } }),
    ).rejects.toThrow('Unknown number')
  })

  it('brings every card outcome back to the confirm page', async () => {
    const fetch = mockFetch({ PaymentUrl: 'https://pay.example/cc', RequestId: 'r1', Status: '0' })

    const session = await new IfthenpayPaymentProvider(keys).createSession({ ...input, method: 'card' })

    expect(sentBody(fetch)).toMatchObject({
      successUrl: input.returnUrl,
      cancelUrl: `${input.returnUrl}?payment=failed`,
      errorUrl: `${input.returnUrl}?payment=failed`,
    })
    expect(session).toMatchObject({ method: 'card', redirectUrl: 'https://pay.example/cc' })
  })

  it('refuses a method the store has no key for', async () => {
    const provider = new IfthenpayPaymentProvider({ antiPhishingKey: 'x', mbKey: 'a' })
    await expect(provider.createSession({ ...input, method: 'mbway' })).rejects.toThrow('mbWayKey')
  })
})

describe('verifyWebhook', () => {
  const callback = (key: string) =>
    new URLSearchParams({ key, orderId: encodeOrderId(orderId), amount: '24.90', requestId: 'r1' }).toString()

  it('maps a callback back to the order', async () => {
    const event = await new IfthenpayPaymentProvider(keys).verifyWebhook(callback('secret'), '')
    expect(event).toMatchObject({ type: 'payment.captured', orderId, sessionId: 'r1', amount: 24.9, currency: 'EUR' })
  })

  it('refuses a wrong anti-phishing key', async () => {
    await expect(new IfthenpayPaymentProvider(keys).verifyWebhook(callback('nope'), '')).rejects.toThrow('anti-phishing')
  })
})
