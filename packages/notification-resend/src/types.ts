import type { Resend } from 'resend'

/** Configuration for {@link ResendNotificationProvider}. */
export interface ResendConfig {
  /** Resend API key (`re_...`). Server-side only. */
  apiKey: string
  /** Default sender address (e.g. `Prood <onboarding@resend.dev>`). */
  defaultFrom: string
  /** Optional pre-constructed Resend client (useful for testing). */
  client?: Resend
}
