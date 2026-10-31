import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { forwardPaymentWebhook } from '../reconcile'

describe('forwardPaymentWebhook', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('takes the store from the path, whatever the query says', async () => {
    vi.stubEnv('COMMERCE_API_URL', 'https://api.test/v1')
    vi.stubEnv('CHECKOUT_API_SECRET', 'secret')
    const fetch = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', fetch)

    await forwardPaymentWebhook('ifthenpay', 'org=other-store&orderId=o1&amount=10', '', 'path-store', 'GET')

    const url = new URL(String((fetch.mock.calls[0] as unknown[])[0]))
    expect(url.searchParams.getAll('org')).toEqual(['path-store'])
    expect(url.searchParams.get('orderId')).toBe('o1')
  })
})
