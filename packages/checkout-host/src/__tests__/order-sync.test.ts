import { describe, expect, it, vi } from 'vitest'
import { CheckoutSession } from '@prood/checkout'
import type { OrderOutcome, PaymentProvider, PaymentSession } from '@prood/types'

vi.mock('server-only', () => ({}))
vi.mock('@prood/commerce', () => ({}))

import { syncSessionWithOrder } from '../order-sync'

const payment: PaymentSession = {
  id: 'p1',
  providerId: 'mock',
  status: 'pending',
  amount: 24.9,
  currency: 'EUR',
  providerData: null,
  redirectUrl: null,
  createdAt: '2026-10-31T10:00:00Z',
}

async function startedSession() {
  const session = new CheckoutSession({
    paymentProvider: { createSession: vi.fn().mockResolvedValue(payment) } as unknown as PaymentProvider,
    currency: 'EUR',
    amount: 24.9,
    fulfillment: 'none',
  })
  session.setCustomerInfo({ email: 'ana@example.pt' })
  await session.submitPayment()
  return session
}

describe('syncSessionWithOrder', () => {
  it.each<[OrderOutcome, string]>([
    [{ state: 'pending', payable: false }, 'payment'],
    [{ state: null, payable: true }, 'payment'],
    [{ state: 'complete', payable: false }, 'complete'],
    [{ state: 'failed', payable: false }, 'failed'],
  ])('moves a started session for %j to %s', async (outcome, state) => {
    const session = await startedSession()
    syncSessionWithOrder(session, outcome)
    expect(session.state).toBe(state)
  })
})
