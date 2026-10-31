// ---------------------------------------------------------------------------
// Payment domain types
// ---------------------------------------------------------------------------

import type { Id, LocalizedString, Maybe } from './common.js'

/** Known payment types */
export type PaymentType =
  | 'card'
  | 'apple_pay'
  | 'google_pay'
  | 'mbway'
  | 'multibanco'
  | 'cash_on_delivery'
  | 'bank_transfer'
  | 'paypal'
  | 'custom'

/** Buy Now Pay Later installment details */
export interface Installment {
  count: number
  /** Amount per installment in major currency units */
  amount: number
  currency: string
}

/** Payment method option */
export interface PaymentMethod {
  id: Id
  type: PaymentType | string
  name: LocalizedString
  provider: string
  /** BNPL installment info (for Tamara, Tabby, etc.) */
  installments: Maybe<Installment>
  /** Icon/logo URL */
  icon: Maybe<string>
}
