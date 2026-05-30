"use server"

import type { Address, Order } from "@prood/types"
import { priceToMajorAmount } from "@prood/types"
import { headers } from "next/headers"
import { clearCartId, getCartId } from "@/lib/cart-cookie"
import { getCommerceApi } from "@/lib/commerce-api"
import { resolveTenantId } from "@/lib/tenant"

type CheckoutAddress = Omit<Address, "id" | "isDefault">

export interface CheckoutResult {
  ok: boolean
  error?: string
  orderId?: string
  checkoutUrl?: string
}

export interface StartCheckoutInput {
  email: string
  address: Partial<CheckoutAddress>
  providerId?: string
}

async function unwrap<T>(
  promise: Promise<{ data?: unknown; error?: unknown }>
): Promise<T> {
  const { data, error } = await promise
  if (error) throw error
  if (data === undefined) throw new Error("Empty API response")
  return data as T
}

export async function startCheckout(input: StartCheckoutInput): Promise<CheckoutResult> {
  try {
    const cartId = await getCartId()
    if (!cartId) return { ok: false, error: "No active cart" }

    const api = await getCommerceApi()
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

    const methods = await unwrap<{ id: string }[]>(
      api.GET("/carts/{id}/shipping-methods", { params: { path: { id: cartId } } })
    )
    if (methods[0]) {
      await unwrap(
        api.PATCH("/carts/{id}/shipping-method", {
          params: { path: { id: cartId } },
          body: { methodId: methods[0].id },
        })
      )
    }

    const order = await unwrap<Order>(
      api.POST("/carts/{id}/place-order", { params: { path: { id: cartId } } })
    )

    const providerId = input.providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? "stripe"
    const checkoutUrl = process.env.CHECKOUT_URL ?? "http://localhost:3004"
    const headerList = await headers()
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
    const proto = headerList.get("x-forwarded-proto") ?? "http"
    const storefrontOrigin = host
      ? `${proto}://${host.split(":")[0]}`
      : (process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
    const tenantId = await resolveTenantId()

    const sessionRes = await fetch(`${checkoutUrl}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CHECKOUT_API_SECRET
          ? { "x-checkout-secret": process.env.CHECKOUT_API_SECRET }
          : {}),
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: priceToMajorAmount(order.totals.total),
        currency: order.totals.total.currency,
        returnUrl: `${storefrontOrigin}/order-confirmation?orderId=${order.id}`,
        providerId,
        tenantId,
        customerInfo: {
          email: input.email,
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone ?? undefined,
        },
        fulfillment: "none",
      }),
    })

    if (!sessionRes.ok) {
      const err = (await sessionRes.json().catch(() => ({}))) as { message?: string }
      return { ok: false, error: err.message ?? "Failed to create checkout session" }
    }

    const session = (await sessionRes.json()) as { checkoutUrl: string }
    await clearCartId()

    return { ok: true, orderId: order.id, checkoutUrl: session.checkoutUrl }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Checkout failed" }
  }
}
