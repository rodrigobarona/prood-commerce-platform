"use server"

import type { Address, Order } from "@prood/types"
import { unwrap } from "@prood/api-client"
import { headers } from "next/headers"
import { clearCartId, getCartId } from "@/lib/cart-cookie"
import { getCommerceApi } from "@/lib/commerce-api"
import { resolveTenantId } from "@/lib/tenant"
import { fetchStoreInfo } from "@/lib/commerce-data"
import { localized } from "@prood/ui/lib/commerce"

type CheckoutAddress = Omit<Address, "id" | "isDefault">

export interface CheckoutResult {
  ok: boolean
  error?: string
  orderId?: string
  checkoutUrl?: string
}

export interface StartCheckoutInput {
  email?: string
  address?: Partial<CheckoutAddress>
  shippingMethodId?: string
  providerId?: string
  expressPayment?: "apple" | "google"
}

export async function startCheckout(input: StartCheckoutInput): Promise<CheckoutResult> {
  try {
    const cartId = await getCartId()
    if (!cartId) return { ok: false, error: "No active cart" }

    const checkoutUrl = process.env.CHECKOUT_URL
    const checkoutSecret = process.env.CHECKOUT_API_SECRET
    if (!checkoutUrl || !checkoutSecret) {
      throw new Error("CHECKOUT_URL and CHECKOUT_API_SECRET are required")
    }
    const headerList = await headers()
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
    if (!host) throw new Error("Missing Host header")
    const proto = headerList.get("x-forwarded-proto") ?? "http"
    const storefrontOrigin = `${proto}://${host}`
    const tenantId = await resolveTenantId()

    const api = await getCommerceApi()

    if (input.address) {
      const address = input.address as CheckoutAddress
      const addressBody = {
        ...address,
        phone: address.phone ?? undefined,
        street2: address.street2 ?? undefined,
        state: address.state ?? undefined,
        postalCode: address.postalCode ?? undefined,
        district: address.district ?? undefined,
        nationalAddress: address.nationalAddress ?? undefined,
        additionalNumber: address.additionalNumber ?? undefined,
      }

      await unwrap(
        api.PUT("/carts/{id}/shipping-address", {
          params: { path: { id: cartId } },
          body: addressBody,
        })
      )
      await unwrap(
        api.PUT("/carts/{id}/billing-address", {
          params: { path: { id: cartId } },
          body: addressBody,
        })
      )
    }

    const methods = await unwrap<{ id: string }[]>(
      api.GET("/carts/{id}/shipping-methods", { params: { path: { id: cartId } } })
    )
    const methodId = input.shippingMethodId ?? methods[0]?.id
    if (methodId) {
      await unwrap(
        api.PATCH("/carts/{id}/shipping-method", {
          params: { path: { id: cartId } },
          body: { methodId },
        })
      )
    }

    const order = await unwrap<Order>(
      api.POST("/carts/{id}/place-order", {
        params: { path: { id: cartId } },
        body: { email: input.email || undefined, providerId: input.providerId },
      })
    )
    // The order consumed the cart, so the cookie must not outlive it.
    await clearCartId()

    const confirmationUrl = `${storefrontOrigin}/order-confirmation?orderId=${order.id}${input.email ? `&email=${encodeURIComponent(input.email)}` : ""}`
    if (order.totals.total.amount === 0) {
      return { ok: true, orderId: order.id, checkoutUrl: confirmationUrl }
    }

    let storeName: string | undefined
    try {
      const store = await fetchStoreInfo()
      if (store) storeName = localized(store.name) || undefined
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
              firstName: input.address?.firstName ?? undefined,
              lastName: input.address?.lastName ?? undefined,
              phone: input.address?.phone || undefined,
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
    return { ok: false, error: err instanceof Error ? err.message : "Checkout failed" }
  }
}
