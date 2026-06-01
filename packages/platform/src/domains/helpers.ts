// ---------------------------------------------------------------------------
// Shared helpers for domain implementations
// ---------------------------------------------------------------------------

import type { LocalizedField, Maybe, Price, DiscountablePrice, Image } from '@prood/types'
import { DEFAULT_LOCALE } from '@prood/types'
export function resolveLocalized(
  field: LocalizedField | null | undefined,
  locale: string = DEFAULT_LOCALE,
  fallback = DEFAULT_LOCALE,
): string {
  if (!field) return ''
  return field[locale] ?? field[fallback] ?? Object.values(field)[0] ?? ''
}

/** Safely normalize a JSONB value into a LocalizedField */
export function normalizeLocalizedField(value: unknown): LocalizedField {
  if (value == null) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as LocalizedField
      }
    } catch {
      return { [DEFAULT_LOCALE]: value }
    }
    return { [DEFAULT_LOCALE]: value }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as LocalizedField
  }
  return {}
}

/** Generate a URL-safe slug from a localized name (uses default locale) */
export function slugifyLocalized(name: LocalizedField): string {
  const base = name[DEFAULT_LOCALE] || Object.values(name)[0] || ''
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/^-|-$/g, '')
    || crypto.randomUUID().slice(0, 8)
}

/**
 * Convert a Prisma Decimal (or number) to a plain number.
 * Prisma returns Decimal fields as `Prisma.Decimal` objects which have `.toNumber()`.
 */
export function toNumber(value: any): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value?.toNumber === 'function') return value.toNumber()
  return Number(value)
}

/** Create a Price from a numeric/Decimal value + currency */
export function price(amount: any, currency: string): Maybe<Price> {
  if (amount == null) return null
  const n = toNumber(amount)
  return { amount: n, currency, formatted: `${n} ${currency}` }
}

/** Create a non-null Price (for required fields) */
export function priceRequired(amount: any, currency: string): Price {
  const n = toNumber(amount)
  return { amount: n, currency, formatted: `${n} ${currency}` }
}

/** Create a DiscountablePrice from price + compareAt */
export function discountablePrice(
  amount: any,
  compareAt: any,
  currency: string,
): Maybe<DiscountablePrice> {
  if (amount == null) return null
  const a = toNumber(amount)
  const base: DiscountablePrice = {
    amount: a,
    currency,
    formatted: `${a} ${currency}`,
  }
  if (compareAt != null) {
    const c = toNumber(compareAt)
    if (c > a) {
      base.originalAmount = c
      base.discountPercent = Math.round(((c - a) / c) * 100)
    }
  }
  return base
}

/** Create an Image from url + altText */
export function img(url: string, altText: string | null): Image {
  return {
    url,
    alt: altText ?? '',
  }
}

/**
 * Safely parse a JSON field from the database.
 * With PostgreSQL native Json type, Prisma returns objects directly.
 * This also handles legacy string values for compatibility.
 */
export function parseJsonField(value: unknown): any {
  if (value == null) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) }
    catch { return value }
  }
  return value
}

/** Generate an order number like ORD-20260211-XXXX */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${date}-${random}`
}
