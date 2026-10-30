import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from '../redirect.js'

describe('safeRedirectPath', () => {
  it('keeps same-origin paths with their query and hash', () => {
    expect(safeRedirectPath('/invite/abc?x=1#h')).toBe('/invite/abc?x=1#h')
  })

  it.each([
    ['https://evil.com'],
    ['javascript:alert(1)'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['/\n/evil.com'],
    ['/\t/evil.com'],
    ['/a/../..//evil.com'],
    ['/.//evil.com'],
    ['/..//evil.com'],
  ])('rejects %j', (value) => {
    expect(safeRedirectPath(value)).toBe('/')
  })

  it('uses the fallback for missing and rejected values', () => {
    expect(safeRedirectPath(null, '/account')).toBe('/account')
    expect(safeRedirectPath('//evil.com', '/account')).toBe('/account')
  })
})
