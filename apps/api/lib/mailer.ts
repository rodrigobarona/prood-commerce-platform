import { ResendNotificationProvider } from '@prood/notification-resend'

let instance: ResendNotificationProvider | null = null

export function getMailer(): ResendNotificationProvider {
  return (instance ??= new ResendNotificationProvider({
    apiKey: process.env.RESEND_API_KEY!,
    defaultFrom: process.env.RESEND_FROM_EMAIL ?? 'Prood <onboarding@resend.dev>',
  }))
}
