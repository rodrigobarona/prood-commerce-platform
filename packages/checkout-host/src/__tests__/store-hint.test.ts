import { createHmac, hkdfSync } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { readStoreHint, signStoreHint } from '../store-hint'

const hint = { name: 'Loja da Ana', email: 'ola@loja.pt', home: 'https://loja.pt' }
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

beforeEach(() => vi.stubEnv('CHECKOUT_API_SECRET', 'secret'))
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('store hints', () => {
  it('reads back what was signed, and only that', () => {
    expect(readStoreHint(signStoreHint('cs_1', hint) ?? undefined, 'cs_1')).toEqual(hint)
  })

  it('refuses a forged name or a missing signature', () => {
    const token = signStoreHint('cs_1', hint) ?? ''
    const payload = JSON.parse(Buffer.from(token.split('.')[0] ?? '', 'base64url').toString('utf8'))
    const forged = Buffer.from(JSON.stringify({ ...payload, email: 'evil@example.com' })).toString('base64url')
    expect(readStoreHint(`${forged}.${token.split('.')[1]}`, 'cs_1')).toBeNull()
    expect(readStoreHint(forged, 'cs_1')).toBeNull()
  })

  it("won't trust a hint signed with another secret", () => {
    const token = signStoreHint('cs_1', hint) ?? undefined
    vi.stubEnv('CHECKOUT_API_SECRET', 'other')
    expect(readStoreHint(token, 'cs_1')).toBeNull()
  })

  it('does nothing without a secret', () => {
    vi.stubEnv('CHECKOUT_API_SECRET', '')
    expect(signStoreHint('cs_1', hint)).toBeNull()
  })

  it("can't be replayed on another session's page", () => {
    const token = signStoreHint('cs_1', hint) ?? undefined
    expect(readStoreHint(token, 'cs_invented')).toBeNull()
  })

  it('lasts as long as a started payment, and no longer', () => {
    vi.useFakeTimers()
    const token = signStoreHint('cs_1', hint) ?? undefined
    vi.advanceTimersByTime(WEEK_MS - 1000)
    expect(readStoreHint(token, 'cs_1')).toEqual(hint)
    vi.advanceTimersByTime(2000)
    expect(readStoreHint(token, 'cs_1')).toBeNull()
  })

  it("won't take a hint with no expiry, even one that's properly signed", () => {
    const key = Buffer.from(hkdfSync('sha256', 'secret', '', 'prood/checkout/store-hint', 32))
    const sign = (body: object) => {
      const payload = Buffer.from(JSON.stringify(body)).toString('base64url')
      return `${payload}.${createHmac('sha256', key).update(payload).digest('base64url')}`
    }
    const exp = Math.floor(Date.now() / 1000) + 60
    expect(readStoreHint(sign({ ...hint, sessionId: 'cs_1', exp }), 'cs_1')).toEqual(hint)
    expect(readStoreHint(sign({ ...hint, sessionId: 'cs_1' }), 'cs_1')).toBeNull()
  })

  it('signs with a derived key, not the API secret itself', () => {
    const token = signStoreHint('cs_1', hint) ?? ''
    const [payload, mark] = token.split('.')
    expect(mark).not.toBe(createHmac('sha256', 'secret').update(payload ?? '').digest('base64url'))
    expect(mark).not.toBe(createHmac('sha256', 'store-hint:secret').update(payload ?? '').digest('base64url'))
  })
})
