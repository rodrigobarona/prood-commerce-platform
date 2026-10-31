import { afterEach, describe, expect, it, vi } from 'vitest'
import { EasypayPaymentProvider } from '../easypay-provider.js'

function mockFetch(...responses: Array<{ status?: number; body?: unknown }>) {
  const fn = vi.fn()
  for (const { status = 200, body = {} } of responses) {
    fn.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
  }
  vi.stubGlobal('fetch', fn)
  return fn
}

function sentBody(fn: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse((fn.mock.calls[call]?.[1] as RequestInit).body as string) as Record<string, any>
}

const easypay = (baseUrl?: string) =>
  new EasypayPaymentProvider({ accountId: 'acc', apiKey: 'key', baseUrl })

const input = { amount: 24.9, currency: 'EUR', orderId: 'order-1', customer: { email: 'ana@example.pt' } }

afterEach(() => vi.useRealTimers())

describe('createSession', () => {
  it('asks for a dated Multibanco reference and reports it', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-31T10:00:00Z') })
    const fetch = mockFetch({
      body: { id: 'p1', method: { type: 'mb', entity: '11111', reference: '123456789', expiration_time: '2026-11-03 10:00' } },
    })

    const session = await easypay().createSession({ ...input, method: 'multibanco' })

    expect(sentBody(fetch)).toMatchObject({ method: 'mb', expiration_time: '2026-11-03 10:00' })
    expect(session).toMatchObject({
      method: 'multibanco',
      providerData: { entity: '11111', reference: '123456789', expiresAt: '2026-11-03T10:00' },
    })
  })

  it('fails rather than show a blank reference', async () => {
    mockFetch({ body: { id: 'p1', method: { type: 'mb' } } })
    await expect(easypay().createSession({ ...input, method: 'multibanco' })).rejects.toThrow('no Multibanco reference')
  })

  it('sends MB WAY to the national number', async () => {
    const fetch = mockFetch({ body: { id: 'p1', method: { type: 'mbw' } } })

    const session = await easypay().createSession({
      ...input,
      method: 'mbway',
      customer: { ...input.customer, phone: '+351 912 345 678' },
    })

    expect(sentBody(fetch)).toMatchObject({
      method: 'mbw',
      customer: { phone: '912345678', phone_indicative: '+351' },
    })
    expect(sentBody(fetch).expiration_time).toBeUndefined()
    expect(session.method).toBe('mbway')
  })

  it('refuses MB WAY without a Portuguese mobile number', async () => {
    const fetch = mockFetch()
    await expect(
      easypay().createSession({ ...input, method: 'mbway', customer: { phone: '+34 612 345 678' } }),
    ).rejects.toThrow('mobile number')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends the shopper to the hosted card page', async () => {
    const fetch = mockFetch({ body: { id: 'p1', method: { type: 'cc', url: 'https://pay.example/1' } } })
    const session = await easypay().createSession({ ...input, method: 'card' })
    expect(sentBody(fetch).method).toBe('cc')
    expect(session).toMatchObject({ method: 'card', redirectUrl: 'https://pay.example/1' })
  })
})

describe('refund', () => {
  const paid = { id: 'p1', value: 24.9, captures: [{ id: 'cap1', status: 'success' }] }

  it('refunds the capture with a key Easypay honours, and reads nothing back', async () => {
    const fetch = mockFetch({ body: paid }, { status: 201, body: { status: 'ok', id: 'r1' } })

    await easypay().refund({ sessionId: 'p1', amount: 24.9, idempotencyKey: 'refund-order-1' })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[1]?.[0]).toBe('https://api.prod.easypay.pt/2.0/refund/cap1')
    expect((fetch.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject({ 'Idempotency-Key': 'refund-order-1' })
    expect(sentBody(fetch, 1)).toEqual({ value: 24.9, transaction_key: 'refund-order-1' })
  })

  it('gives every refund call a deadline', async () => {
    const fetch = mockFetch({ body: paid }, { status: 201 })

    await easypay().refund({ sessionId: 'p1', amount: 24.9 })

    expect((fetch.mock.calls[0]?.[1] as RequestInit).signal).toBeInstanceOf(AbortSignal)
    expect((fetch.mock.calls[1]?.[1] as RequestInit).signal).toBeInstanceOf(AbortSignal)
  })

  it('sends nothing on a retry after the capture was refunded', async () => {
    const fetch = mockFetch({ body: { ...paid, captures: [{ id: 'cap1', status: 'refunded' }] } })

    await easypay().refund({ sessionId: 'p1', amount: 24.9, idempotencyKey: 'refund-order-1' })

    expect(fetch).toHaveBeenCalledOnce()
  })

  it.each([
    ['has no capture', []],
    ['is still being captured', [{ id: 'cap1', status: 'pending' }]],
    ['failed to capture', [{ id: 'cap1', status: 'failed' }]],
  ])('sends nothing when the payment %s', async (_name, captures) => {
    const fetch = mockFetch({ body: { ...paid, captures } })
    await expect(easypay().refund({ sessionId: 'p1' })).rejects.toThrow('no capture')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('reports a refused refund', async () => {
    mockFetch({ body: paid }, { status: 422, body: { status: 'error', message: ['Refund window expired'] } })
    await expect(easypay().refund({ sessionId: 'p1' })).rejects.toThrow('Easypay API error (422)')
  })

  it('does not offer to refund Multibanco, which needs the shopper IBAN', () => {
    expect(easypay().refundableMethods).toEqual(['mbway', 'card'])
  })
})

describe('verifyWebhook', () => {
  const notification = JSON.stringify({ id: 'r1', key: 'refund-order-1', type: 'refund', status: 'success' })
  const payment = { id: 'p1', key: 'order-1', value: 24.9, currency: 'eur', payment_status: 'paid' }
  const refund = { id: 'r1', status: 'success', value: 24.9, capture: { payment_id: 'p1', value: 24.9 } }

  it('follows a refund notification from the refund to its order', async () => {
    const fetch = mockFetch({ body: refund }, { body: payment })

    await expect(easypay().verifyWebhook(notification, '')).resolves.toMatchObject({
      type: 'payment.refunded',
      sessionId: 'p1',
      orderId: 'order-1',
      amount: 24.9,
      currency: 'EUR',
    })
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.prod.easypay.pt/2.0/refund/r1')
    expect(fetch.mock.calls[1]?.[0]).toBe('https://api.prod.easypay.pt/2.0/single/p1')
  })

  it('tells a partial refund from a full one', async () => {
    mockFetch({ body: { ...refund, value: 5 } }, { body: payment })
    await expect(easypay().verifyWebhook(notification, '')).resolves.toMatchObject({
      type: 'payment.partially_refunded',
      amount: 5,
    })
  })

  it.each(['pending', 'waiting', 'failed'])('records nothing while the refund is %s', async (status) => {
    mockFetch({ body: { ...refund, status } }, { body: payment })
    await expect(easypay().verifyWebhook(notification, '')).resolves.toMatchObject({ type: 'payment.updated' })
  })

  it('still reads other notifications from the payment', async () => {
    const fetch = mockFetch({ body: payment })
    await expect(
      easypay().verifyWebhook(JSON.stringify({ id: 'p1', type: 'capture', status: 'success' }), ''),
    ).resolves.toMatchObject({ type: 'payment.captured', sessionId: 'p1', orderId: 'order-1' })
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.prod.easypay.pt/2.0/single/p1')
  })
})

describe('checkCredentials', () => {
  it('uses a read-only call', async () => {
    const fetch = mockFetch({ body: { data: [] } })
    await expect(easypay().checkCredentials()).resolves.toEqual({ ok: true })
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.prod.easypay.pt/2.0/single?limit=1')
    expect((fetch.mock.calls[0]?.[1] as RequestInit).method).toBeUndefined()
  })

  it('accepts the base URL as Easypay documents it', async () => {
    const fetch = mockFetch({ body: { data: [] } })
    await easypay('https://api.test.easypay.pt/2.0/').checkCredentials()
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.test.easypay.pt/2.0/single?limit=1')
  })

  it('names the API key when Easypay refuses it', async () => {
    mockFetch({ status: 401 })
    await expect(easypay().checkCredentials()).resolves.toEqual({ ok: false, reason: 'rejected', field: 'apiKey' })
  })

  it('reports an outage as unreachable', async () => {
    mockFetch({ status: 503 })
    await expect(easypay().checkCredentials()).resolves.toEqual({ ok: false, reason: 'unreachable' })
  })

  it('never sends credentials to another host', async () => {
    const fetch = mockFetch()
    await expect(easypay('https://evil.example').checkCredentials()).resolves.toEqual({
      ok: false,
      reason: 'rejected',
      field: 'baseUrl',
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})
