"use server"

import type { Address } from "@workspace/commerce/types"
import {
  getShippingMethods,
  placeOrder,
  priceToMajorAmount,
  revalidateProducts,
  setBillingAddress,
  setShippingAddress,
  setShippingMethod,
} from "@workspace/commerce"
import { clearCartId, getCartId } from "@/lib/cart-cookie"
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

export async function startCheckout(input: StartCheckoutInput): Promise<CheckoutResult> {
  try {
    const cartId = await getCartId()
    if (!cartId) return { ok: false, error: "No active cart" }

    const tenantId = await resolveTenantId()
    const address = input.address as CheckoutAddress
    await setShippingAddress(cartId, address, tenantId)
    await setBillingAddress(cartId, address, tenantId)

    const methods = await getShippingMethods(cartId, tenantId)
    if (methods[0]) await setShippingMethod(cartId, methods[0].id, tenantId)

    const order = await placeOrder(cartId, tenantId)
    revalidateProducts(tenantId)

    const providerId = input.providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? "stripe"
    const checkoutUrl = process.env.CHECKOUT_URL ?? "http://localhost:3100"
    const storefrontUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

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
        returnUrl: `${storefrontUrl}/order-confirmation?orderId=${order.id}`,
        providerId,
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
