import { ResendNotificationProvider } from "@prood/notification-resend"

let instance: ResendNotificationProvider | null = null

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for email delivery`)
  return value
}

export function getMailer(): ResendNotificationProvider {
  return (instance ??= new ResendNotificationProvider({
    apiKey: requiredEnv("RESEND_API_KEY"),
    defaultFrom: requiredEnv("RESEND_FROM_EMAIL"),
  }))
}
