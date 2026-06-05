import { headers } from "next/headers"
import { CheckoutFlow } from "@/components/checkout/checkout-flow"

export const metadata = { title: "Checkout" }

export default async function CheckoutPage() {
  const headerList = await headers()
  const geoCountry = headerList.get("x-vercel-ip-country") ?? undefined

  return <CheckoutFlow geoCountry={geoCountry} />
}
