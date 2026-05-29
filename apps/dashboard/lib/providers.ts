// Provider registry — static metadata for the integrations a merchant can
// configure. Credentials are stored per organization (see lib/integrations.ts).

export type ProviderType = "payment" | "notification" | "analytics"

export interface ProviderField {
  key: string
  label: string
  type: "text" | "password"
  required: boolean
  placeholder?: string
}

export interface ProviderMeta {
  id: string
  name: string
  type: ProviderType
  description: string
  docsUrl?: string
  fields: ProviderField[]
}

export const providerRegistry: ProviderMeta[] = [
  // ---- Payment ----
  {
    id: "stripe",
    name: "Stripe",
    type: "payment",
    description:
      "Accept cards, wallets, and local payment methods worldwide with the Stripe Payment Element.",
    docsUrl: "https://stripe.com/docs",
    fields: [
      { key: "publishableKey", label: "Publishable key", type: "text", required: true, placeholder: "pk_live_..." },
      { key: "secretKey", label: "Secret key", type: "password", required: true, placeholder: "sk_live_..." },
      { key: "webhookSecret", label: "Webhook signing secret", type: "password", required: false, placeholder: "whsec_..." },
    ],
  },
  {
    id: "easypay",
    name: "EasyPay",
    type: "payment",
    description:
      "Portuguese payments — Multibanco, MB WAY, and card payments via EasyPay.",
    docsUrl: "https://docs.easypay.pt",
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "apiKey", label: "API key", type: "password", required: true },
      { key: "baseUrl", label: "API base URL", type: "text", required: false, placeholder: "https://api.prod.easypay.pt/2.0" },
    ],
  },
  {
    id: "ifthenpay",
    name: "IfThenPay",
    type: "payment",
    description:
      "Portuguese payments — Multibanco, MB WAY, Payshop, and credit card via IfThenPay.",
    docsUrl: "https://www.ifthenpay.com",
    fields: [
      { key: "antiPhishingKey", label: "Anti-phishing key", type: "password", required: true },
      { key: "mbKey", label: "Multibanco key", type: "text", required: false },
      { key: "mbWayKey", label: "MB WAY key", type: "text", required: false },
      { key: "ccKey", label: "Credit card key", type: "text", required: false },
    ],
  },
  // ---- Notification ----
  {
    id: "resend",
    name: "Resend",
    type: "notification",
    description:
      "Transactional email — order confirmations, shipping updates, and receipts.",
    docsUrl: "https://resend.com/docs",
    fields: [
      { key: "apiKey", label: "API key", type: "password", required: true, placeholder: "re_..." },
      { key: "fromEmail", label: "From email", type: "text", required: true, placeholder: "orders@yourbrand.com" },
      { key: "fromName", label: "From name", type: "text", required: false, placeholder: "Your Brand" },
    ],
  },
  {
    id: "smtp",
    name: "SMTP",
    type: "notification",
    description: "Send transactional email through any SMTP server.",
    fields: [
      { key: "host", label: "Host", type: "text", required: true, placeholder: "smtp.example.com" },
      { key: "port", label: "Port", type: "text", required: true, placeholder: "587" },
      { key: "user", label: "Username", type: "text", required: true },
      { key: "pass", label: "Password", type: "password", required: true },
      { key: "from", label: "From address", type: "text", required: true, placeholder: "orders@yourbrand.com" },
    ],
  },
  // ---- Analytics ----
  {
    id: "ga4",
    name: "Google Analytics 4",
    type: "analytics",
    description:
      "Automatic GA4 tracking for page views, add-to-cart, and purchase events.",
    docsUrl: "https://developers.google.com/analytics",
    fields: [
      { key: "measurementId", label: "Measurement ID", type: "text", required: true, placeholder: "G-XXXXXXXXXX" },
    ],
  },
]

export function getProvider(id: string): ProviderMeta | undefined {
  return providerRegistry.find((provider) => provider.id === id)
}

export const providerTypeLabels: Record<ProviderType, string> = {
  payment: "Payment",
  notification: "Notification",
  analytics: "Analytics",
}
