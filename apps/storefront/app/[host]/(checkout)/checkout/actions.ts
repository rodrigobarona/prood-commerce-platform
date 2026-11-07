"use server"

import { unwrap } from "@prood/api-client"
import { headers } from "next/headers"
import { z } from "zod"
import { addressSchema, contactSchema } from "@/components/checkout/schemas"
import { clearCartId, getCartId } from "@/lib/cart-cookie"
import { getStore } from "@/lib/catalog"
import { getCommerceApi } from "@/lib/commerce-api"
import { requestHost } from "@/lib/store-host"
import { resolveRequestTenantId } from "@/lib/tenant"
import { checkoutErrorMessage, isStoreClosedError } from "@/lib/checkout-error"
import { JUST_PLACED } from "@/lib/order-href"
import { localized } from "@prood/ui/lib/commerce"

export interface CheckoutResult {
  ok: boolean
  error?: string
  /** The store refused the order: nothing the shopper changes will help. */
  closed?: boolean
  orderId?: string
  checkoutUrl?: string
}

/** A Server Action is a public endpoint: anyone can call it with anything, so it checks what the form checked. */
const startCheckoutInput = z.object({
  email: contactSchema.shape.email.optional(),
  phone: z.string().trim().max(40).optional(),
  address: addressSchema.optional(),
  providerId: z.string().max(100).optional(),
})

export type StartCheckoutInput = z.input<typeof startCheckoutInput>

export async function startCheckout(raw: StartCheckoutInput): Promise<CheckoutResult> {
  const parsed = startCheckoutInput.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Check your details and try again." }
  const input = parsed.data

  try {
    const cartId = await getCartId()
    if (!cartId) return { ok: false, error: "Your cart is empty." }

    // The public base including its path (https://prood.com/pay): routes are appended to it.
    const checkoutUrl = process.env.CHECKOUT_URL?.replace(/\/$/, "")
    const checkoutSecret = process.env.CHECKOUT_API_SECRET
    if (!checkoutUrl || !checkoutSecret) {
      throw new Error("CHECKOUT_URL and CHECKOUT_API_SECRET are required")
    }
    const headerList = await headers()
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
    if (!host) throw new Error("Missing Host header")
    const proto = headerList.get("x-forwarded-proto") ?? "http"
    const storefrontOrigin = `${proto}://${host}`
    const tenantId = await resolveRequestTenantId()

    const api = await getCommerceApi()

    if (input.address) {
      const address = { ...input.address, phone: input.phone }
      await unwrap(
        api.PUT("/carts/{id}/shipping-address", {
          params: { path: { id: cartId } },
          body: address,
        })
      )
      await unwrap(
        api.PUT("/carts/{id}/billing-address", {
          params: { path: { id: cartId } },
          body: address,
        })
      )
    }

    const order = await unwrap(
      api.POST("/carts/{id}/place-order", {
        params: { path: { id: cartId } },
        body: { email: input.email || undefined, providerId: input.providerId },
      })
    )
    // The order consumed the cart, so the cookie must not outlive it.
    await clearCartId()

    const confirmationUrl = `${storefrontOrigin}/order-confirmation?orderId=${order.id}&placed=${JUST_PLACED}${input.email ? `&email=${encodeURIComponent(input.email)}` : ""}`
    if (order.totals.total.amount === 0) {
      return { ok: true, orderId: order.id, checkoutUrl: confirmationUrl }
    }

    let storeName: string | undefined
    try {
      const store = await getStore(await requestHost())
      storeName = localized(store.name) || undefined
    } catch {
      // non-critical — checkout works without store name
    }

    const sessionRes = await fetch(`${checkoutUrl}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-checkout-secret": checkoutSecret,
      },
      body: JSON.stringify({
        orderId: order.id,
        customerId: order.customerId,
        amount: order.totals.total.amount,
        currency: order.totals.total.currency,
        customerInfo: input.email
          ? {
              email: input.email,
              firstName: input.address?.firstName,
              lastName: input.address?.lastName,
              phone: input.phone,
            }
          : undefined,
        returnUrl: confirmationUrl,
        providerId: input.providerId,
        tenantId,
        storeName,
        fulfillment: "none",
      }),
    }).catch((err) => {
      console.error(`[checkout] session request failed for order ${order.id}`, err)
      return null
    })

    const session = sessionRes?.ok
      ? ((await sessionRes.json().catch(() => null)) as { checkoutUrl?: string } | null)
      : null
    if (!session?.checkoutUrl) {
      console.error(`[checkout] no payment session for order ${order.id}: ${sessionRes?.status}`)
      // The cart is gone, so the confirmation page is where the shopper can
      // still see their order number.
      return { ok: true, orderId: order.id, checkoutUrl: `${confirmationUrl}&payment=failed` }
    }

    return { ok: true, orderId: order.id, checkoutUrl: session.checkoutUrl }
  } catch (err) {
    console.error("[checkout] failed to start", err)
    return { ok: false, error: checkoutErrorMessage(err), closed: isStoreClosedError(err) }
  }
}
