import type { Resend } from 'resend'

/** Configuration for {@link ResendNotificationProvider}. */
export interface ResendConfig {
  /** Resend API key (`re_...`). Server-side only. */
  apiKey: string
  /** Default sender address on a verified Resend domain. */
  defaultFrom: string
  /** Optional pre-constructed Resend client (useful for testing). */
  client?: Resend
}
