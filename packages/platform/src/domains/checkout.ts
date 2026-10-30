// ---------------------------------------------------------------------------
// Checkout domain — shipping, addresses, and order placement
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type {
  Cart,
  Order,
  ShippingMethod,
  PaymentMethod,
  CheckoutAddress,
} from '@prood/types'
import {
  updateCart,
  deleteCart,
  findProductById,
} from '../database/index.js'
import { normalizeLocalizedField } from './helpers.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { requireSellable } from './availability.js'
import { createCartDomain } from './cart.js'
import { listPaymentMethods, listShippingMethods } from './checkout-methods.js'
import { recordOrder, type OrderLine } from './order-recorder.js'

export function createCheckoutDomain() {
  const cartDomain = createCartDomain()

  return {
    async getShippingMethods(_cartId: string): Promise<ShippingMethod[]> {
      return listShippingMethods(await getStoreCurrency())
    },

    async setShippingAddress(cartId: string, address: CheckoutAddress): Promise<Cart> {
      await updateCart(cartId, { shippingAddress: address as any })
      return cartDomain.getCart(cartId)
    },

    async setBillingAddress(cartId: string, address: CheckoutAddress): Promise<Cart> {
      await updateCart(cartId, { billingAddress: address as any })
      return cartDomain.getCart(cartId)
    },

    async setShippingMethod(cartId: string, methodId: string): Promise<Cart> {
      if (!listShippingMethods(await getStoreCurrency()).some(m => m.id === methodId)) {
        throw new CommerceError(`Unknown shipping method: ${methodId}`, 'VALIDATION', 422)
      }
      await updateCart(cartId, { shippingMethodId: methodId })
      return cartDomain.getCart(cartId)
    },

    async getPaymentMethods(_cartId: string): Promise<PaymentMethod[]> {
      return listPaymentMethods()
    },

    async setPaymentMethod(cartId: string, methodId: string): Promise<Cart> {
      if (!listPaymentMethods().some(m => m.id === methodId)) {
        throw new CommerceError(`Unknown payment method: ${methodId}`, 'VALIDATION', 422)
      }
      await updateCart(cartId, { paymentMethodId: methodId })
      return cartDomain.getCart(cartId)
    },

    async placeOrder(
      cartId: string,
      options?: { customerId?: string; contactEmail?: string },
    ): Promise<Order> {
      if (options?.customerId) {
        await updateCart(cartId, { customerId: options.customerId })
      }

      const cart = await cartDomain.getCart(cartId)

      if (cart.items.length === 0) {
        throw new CommerceError('Cannot place an order with an empty cart.', 'VALIDATION', 422)
      }

      const lines: OrderLine[] = []
      for (const item of cart.items) {
        // A product can be archived or sell out while it sits in a cart.
        const product = await findProductById(item.productId)
        if (product?.status !== 'active') {
          const name = normalizeLocalizedField(item.name).en ?? item.productId
          throw new CommerceError(`${name} is no longer available.`, 'VALIDATION', 422)
        }
        await requireSellable(product, item.variantId)

        lines.push({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          variantName: item.variantName ?? null,
          image: item.image?.url ?? null,
          quantity: item.quantity,
          price: item.price.amount,
          productType: product.productType,
          requiresShipping: product.requiresShipping,
        })
      }

      const order = await recordOrder({
        lines,
        customerId: cart.customerId,
        contactEmail: options?.contactEmail,
        shippingAddress: cart.shippingAddress,
        billingAddress: cart.billingAddress,
        shippingMethod: cart.shippingMethod,
        paymentMethod: cart.paymentMethod,
        couponCode: cart.couponCode,
        historyNote: 'Order placed',
      })

      await deleteCart(cartId)
      return order
    },
  }
}
