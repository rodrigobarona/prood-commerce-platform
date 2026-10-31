import { describe, expect, it } from 'vitest'
import { orderOutcome, orderPaymentState, toPortugueseMobile } from '../order-payment.js'
import type { Order } from '../order.js'

const details = { method: 'multibanco', entity: '11111', reference: '123456789', expiresAt: null } as const

function state(order: Partial<Order>) {
  return orderPaymentState({ status: 'placed', paymentStatus: 'unpaid', paymentDetails: null, ...order })
}

describe('orderPaymentState', () => {
  it('settles paid and free orders', () => {
    expect(state({ status: 'approved', paymentStatus: 'paid' }).kind).toBe('settled')
    expect(state({ status: 'approved', paymentStatus: 'free' }).kind).toBe('settled')
  })

  it('offers the reference on an unpaid Multibanco order', () => {
    expect(state({ paymentDetails: details })).toEqual({ kind: 'awaiting_multibanco', details })
  })

  it('never calls an unpaid order paid', () => {
    expect(state({}).kind).toBe('awaiting_payment')
    expect(state({ paymentDetails: { ...details, method: 'mbway', reference: null } }).kind).toBe('awaiting_payment')
    expect(state({ paymentStatus: 'authorized' }).kind).toBe('awaiting_payment')
  })

  it('reports failed payments, even with a reference on file', () => {
    expect(state({ paymentStatus: 'voided', status: 'cancelled', paymentDetails: details }).kind).toBe('failed')
    expect(state({ status: 'cancelled', paymentDetails: details }).kind).toBe('failed')
  })

  it('reports refunds and money owed on a cancelled order', () => {
    expect(state({ paymentStatus: 'refunded', status: 'cancelled' }).kind).toBe('refunded')
    expect(state({ paymentStatus: 'partially_refunded', status: 'approved' }).kind).toBe('partially_refunded')
    expect(state({ paymentStatus: 'paid', status: 'cancelled' }).kind).toBe('cancelled_paid')
  })
})

describe('orderOutcome', () => {
  it('leaves an order that is waiting for payment open', () => {
    expect(orderOutcome({ status: 'placed', paymentStatus: 'unpaid' })).toEqual({ state: null, payable: true })
  })

  it('completes a session whose order was paid, whatever the provider API says', () => {
    expect(orderOutcome({ status: 'approved', paymentStatus: 'paid' })).toEqual({ state: 'complete', payable: false })
  })

  it('stops a cancelled order from being paid again', () => {
    expect(orderOutcome({ status: 'cancelled', paymentStatus: 'voided' })).toEqual({ state: 'failed', payable: false })
    expect(orderOutcome({ status: 'cancelled', paymentStatus: 'unpaid' })).toEqual({ state: 'failed', payable: false })
  })

  it('waits on authorized funds, in step with orderPaymentState', () => {
    const authorized = { status: 'placed', paymentStatus: 'authorized', paymentDetails: null } as const
    expect(orderOutcome(authorized)).toEqual({ state: 'pending', payable: false })
    expect(orderPaymentState(authorized).kind).toBe('awaiting_payment')
  })

  it('treats authorized funds on a cancelled order as failed, in both', () => {
    const cancelled = { status: 'cancelled', paymentStatus: 'authorized', paymentDetails: null } as const
    expect(orderOutcome(cancelled)).toEqual({ state: 'failed', payable: false })
    expect(orderPaymentState(cancelled).kind).toBe('failed')
  })

  it('keeps sessions without an order payable', () => {
    expect(orderOutcome(null)).toEqual({ state: null, payable: true })
  })
})

describe('toPortugueseMobile', () => {
  it.each(['912345678', '912 345 678', '+351 912 345 678', '00351912345678', '351#912345678'])(
    'reads %s',
    (input) => expect(toPortugueseMobile(input)).toBe('912345678'),
  )

  it.each(['', null, undefined, '212345678', '91234567', '+34 612 345 678'])('refuses %s', (input) =>
    expect(toPortugueseMobile(input)).toBeNull(),
  )
})

describe('money on the order', () => {
  it("doesn't call a paid, cancelled order complete", () => {
    expect(orderOutcome({ status: 'cancelled', paymentStatus: 'paid' })).toEqual({ state: 'failed', payable: false })
    expect(state({ status: 'cancelled', paymentStatus: 'paid' })).toEqual({ kind: 'cancelled_paid' })
  })

  it('keeps a partly refunded sale standing', () => {
    expect(orderOutcome({ status: 'approved', paymentStatus: 'partially_refunded' })).toEqual({
      state: 'complete',
      payable: false,
    })
    expect(state({ status: 'approved', paymentStatus: 'partially_refunded' })).toEqual({ kind: 'partially_refunded' })
  })

  it('owes the rest back when a partly refunded order is cancelled', () => {
    expect(state({ status: 'cancelled', paymentStatus: 'partially_refunded' })).toEqual({ kind: 'cancelled_paid' })
  })
})
