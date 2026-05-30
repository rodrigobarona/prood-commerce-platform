import { siteConfig } from "@/lib/site"

export const mockStoreSlug = "acme-store"
export const mockSubdomain = `${mockStoreSlug}.${siteConfig.storeDomain}`
export const mockCustomDomain = "shop.acme.com"

export const mockProducts = [
  { name: "Ceramic Mug", price: "€24.00", badge: "In stock" },
  { name: "Linen Tote", price: "€38.00", badge: "Low stock" },
  { name: "Studio Candle", price: "€19.00", badge: "In stock" },
  { name: "Gift Box", price: "€52.00", badge: "New" },
] as const

export const mockOrders = [
  { id: "#1042", customer: "Sofia M.", total: "€86.00", status: "Paid" as const, date: "Today" },
  { id: "#1041", customer: "James K.", total: "€124.50", status: "Fulfilled" as const, date: "Yesterday" },
  { id: "#1040", customer: "Elena R.", total: "€42.00", status: "Pending" as const, date: "Sep 8" },
  { id: "#1039", customer: "Marco T.", total: "€210.00", status: "Paid" as const, date: "Sep 7" },
] as const

export const mockIntegrations = [
  { id: "stripe", name: "Stripe", status: "Connected" as const },
  { id: "easypay", name: "Easypay", status: "Available" as const },
  { id: "ifthenpay", name: "Ifthenpay", status: "Available" as const },
] as const
