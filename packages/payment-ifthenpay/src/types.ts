/** Configuration for {@link IfthenpayPaymentProvider}. */
export interface IfthenpayConfig {
  /** Multibanco backoffice key. */
  mbKey?: string
  /** MB WAY backoffice key. */
  mbWayKey?: string
  /** Credit card backoffice key. */
  ccKey?: string
  /** Anti-phishing key used to validate inbound callbacks. */
  antiPhishingKey: string
  /** API base URL. Defaults to `https://api.ifthenpay.com`. */
  baseUrl?: string
}

/** Multibanco reference response (partial). */
export interface IfthenpayMbResponse {
  Entity?: string
  Reference?: string
  Amount?: string
  ExpiryDate?: string
  RequestId?: string
  Message?: string
  Status?: string
}

/** MB WAY response (partial). */
export interface IfthenpayMbWayResponse {
  RequestId?: string
  Message?: string
  Status?: string
}

/** Credit-card init response (partial). */
export interface IfthenpayCcResponse {
  Status?: string
  Message?: string
  RequestId?: string
  PaymentUrl?: string
}
