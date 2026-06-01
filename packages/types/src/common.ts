// ---------------------------------------------------------------------------
// Common primitives used across all domain types
// ---------------------------------------------------------------------------

/** Nullable helper — a value that may be null */
export type Maybe<T> = T | null

/** String identifier type for all entities */
export type Id = string

/** Flexible locale map stored as JSONB — keys are ISO 639-1 codes */
export type LocalizedField = Record<string, string>

/**
 * Multilingual string keyed by locale code (e.g. en, pt, es).
 * Stored as JSONB in the database; additional languages require no schema change.
 */
export type LocalizedString = LocalizedField

/** Standard paginated result wrapper */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

/** Pagination input params */
export interface PaginationParams {
  page?: number
  perPage?: number
}

/** Monetary amount */
export interface Price {
  /** Amount in the smallest currency unit (e.g., halalat for SAR) */
  amount: number
  /** ISO 4217 currency code (e.g., "SAR", "AED", "USD") */
  currency: string
  /** Human-readable formatted string (e.g., "١٢٫٩٩ ر.س" or "SAR 12.99") */
  formatted: string
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
])

/**
 * Convert a {@link Price} (amount in the smallest currency unit) to the major
 * unit expected by payment gateways (e.g. 4990 → 49.90).
 */
export function priceToMajorAmount(price: Price): number {
  return ZERO_DECIMAL_CURRENCIES.has(price.currency.toUpperCase())
    ? price.amount
    : price.amount / 100
}

/** Price that may have a discount applied */
export interface DiscountablePrice extends Price {
  /** Original amount before discount */
  originalAmount?: number
  /** Discount percentage (0–100) */
  discountPercent?: number
}

/** Image reference */
export interface Image {
  url: string
  alt: string
  width?: number
  height?: number
}

// ---- Advanced Type Utilities ----

/** Recursive partial — allows deep nested partial updates */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[P]>
    : T[P]
}

// ---- Error Types ----

/** Standardized error codes for all adapter operations */
export type CommerceErrorCode =
  | 'NOT_FOUND'
  | 'NOT_SUPPORTED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'RATE_LIMIT'
  | 'PLATFORM_ERROR'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN'

/**
 * Typed error class for all commerce operations.
 * Adapters must throw CommerceError (not raw errors)
 * so consumers can handle failures in a typed, platform-agnostic way.
 */
export class CommerceError extends Error {
  public readonly name = 'CommerceError'

  constructor(
    message: string,
    public readonly code: CommerceErrorCode,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message)
    // Restore prototype chain for instanceof checks after transpilation
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** Type guard — narrows unknown errors to CommerceError */
export function isCommerceError(err: unknown): err is CommerceError {
  return err instanceof CommerceError
}

// ---- Strategy Interfaces ----

/**
 * Tax calculation strategy — allows per-market tax rules.
 * e.g., 15% VAT for KSA, 5% for UAE, 0% for Bahrain.
 */
export interface TaxStrategy {
  /** Calculate tax for a given subtotal and country code */
  calculate(subtotal: number, currency: string, countryCode: string): Price
}
