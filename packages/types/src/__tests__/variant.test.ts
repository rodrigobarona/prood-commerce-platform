import { describe, it, expect } from 'vitest'
import { canQuickAdd, firstAvailableVariant, variantPrice } from '../variant.js'
import type { DiscountablePrice, ProductVariant } from '../index.js'

const price = (amount: number): DiscountablePrice => ({ amount, currency: 'EUR', formatted: `${amount} EUR` })

function variant(id: string, overrides: Partial<ProductVariant> = {}): ProductVariant {
  return { id, sku: null, name: null, price: null, inStock: true, inventoryQuantity: null, ...overrides }
}

describe('firstAvailableVariant', () => {
  it('starts on the first variant in stock', () => {
    const variants = [variant('s', { inStock: false }), variant('m'), variant('l')]
    expect(firstAvailableVariant({ variants })?.id).toBe('m')
  })

  it('selects nothing when every variant is sold out, or there are none', () => {
    expect(firstAvailableVariant({ variants: [variant('s', { inStock: false })] })).toBeNull()
    expect(firstAvailableVariant({ variants: [] })).toBeNull()
  })
})

describe('variantPrice', () => {
  it('uses the price of the variant', () => {
    expect(variantPrice({ price: price(29) }, variant('l', { price: price(32) }))?.amount).toBe(32)
  })

  it('falls to the base price for a variant without one, or no variant', () => {
    expect(variantPrice({ price: price(29) }, variant('l'))?.amount).toBe(29)
    expect(variantPrice({ price: price(29) }, null)?.amount).toBe(29)
  })
})

describe('canQuickAdd', () => {
  it('adds a product with nothing to choose', () => {
    expect(canQuickAdd({ inStock: true, variants: [] })).toBe(true)
    expect(canQuickAdd({ inStock: true, variants: [variant('only')] })).toBe(true)
  })

  it('sends a product with several variants to its page', () => {
    expect(canQuickAdd({ inStock: true, variants: [variant('s'), variant('m')] })).toBe(false)
  })

  it('does not add what is sold out', () => {
    expect(canQuickAdd({ inStock: false, variants: [] })).toBe(false)
    expect(canQuickAdd({ inStock: true, variants: [variant('only', { inStock: false })] })).toBe(false)
  })
})
