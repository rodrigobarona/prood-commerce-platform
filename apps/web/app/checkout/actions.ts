"use server"

import type { Address } from "@workspace/commerce/types"
import {
  createPaymentSession,
  getShippingMethods,
  placeOrder,
  priceToMajorAmount,
  revalidateProducts,
  setBillingAddress,
  setShippingAddress,
  setShippingMethod,
} from "@workspace/commerce"
import { clearCartId, getCartId } from "@/lib/cart-cookie"

type CheckoutAddress = Omit<Address, "id" | "isDefault">

export interface CheckoutResult {
  ok: boolean
  error?: string
  orderId?: string
  providerId?: string
  clientSecret?: string
  redirectUrl?: string
  reference?: { entity?: string; reference?: string }
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

    const address = input.address as CheckoutAddress
    await setShippingAddress(cartId, address)
    await setBillingAddress(cartId, address)

    const methods = await getShippingMethods(cartId)
    if (methods[0]) await setShippingMethod(cartId, methods[0].id)

    const order = await placeOrder(cartId)
    revalidateProducts()
    const providerId = input.providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? "stripe"

    const baseUrl = process.env.BETTER_AUTH_URL ?? ""
    const session = await createPaymentSession({
      amount: priceToMajorAmount(order.totals.total),
      currency: order.totals.total.currency,
      orderId: order.id,
      customer: {
        email: input.email,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone ?? undefined,
      },
      returnUrl: `${baseUrl}/order-confirmation?orderId=${order.id}`,
      providerId,
    })

    // Order placed — the cart is consumed; drop the cookie.
    await clearCartId()

    return {
      ok: true,
      orderId: order.id,
      providerId,
      clientSecret: (session.providerData?.clientSecret as string | undefined) ?? undefined,
      redirectUrl: session.redirectUrl ?? undefined,
      reference: {
        entity: session.providerData?.entity as string | undefined,
        reference: session.providerData?.reference as string | undefined,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Checkout failed" }
  }
}
