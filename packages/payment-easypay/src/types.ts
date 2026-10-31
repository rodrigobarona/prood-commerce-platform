/** Easypay payment method codes. */
export type EasypayMethod = 'mb' | 'mbw' | 'cc'

/** Configuration for {@link EasypayPaymentProvider}. */
export interface EasypayConfig {
  /** Easypay AccountId (UUID). */
  accountId: string
  /** Easypay API key. */
  apiKey: string
  /**
   * API base URL. Defaults to production (`https://api.prod.easypay.pt`).
   * Use `https://api.test.easypay.pt` for sandbox.
   */
  baseUrl?: string
}

/** Shape of the Easypay single-payment method block (partial). */
export interface EasypayMethodBlock {
  type?: string
  entity?: string
  reference?: string
  url?: string
  status?: string
  expiration_time?: string
}

/** Shape of an Easypay single-payment response (partial). */
export interface EasypaySinglePayment {
  id?: string
  /** Merchant reference — Prood sets this to the order id. */
  key?: string
  method?: EasypayMethodBlock
  status?: string | string[]
  payment_status?: string
  currency?: string
  value?: number
  /** Captures of this payment; refunds are issued against a capture. */
  captures?: EasypayCapture[]
}

/** Shape of a capture on an Easypay single payment (partial). */
export interface EasypayCapture {
  id?: string
  status?: 'delayed' | 'waiting' | 'pending' | 'success' | 'failed' | 'refunded'
}
