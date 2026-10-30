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
  createOrder as dbCreateOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
} from '../database/index.js'
import { generateOrderNumber, normalizeLocalizedField } from './helpers.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { createCartDomain } from './cart.js'
import { listPaymentMethods, listShippingMethods } from './checkout-methods.js'
import { mapOrder } from './order-mapper.js'

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
      options?: { status?: string; keepCart?: boolean; customerId?: string; contactEmail?: string },
    ): Promise<Order> {
      if (options?.customerId) {
        await updateCart(cartId, { customerId: options.customerId })
      }

      const cart = await cartDomain.getCart(cartId)

      if (cart.items.length === 0) {
        throw new Error('Cannot place order with empty cart')
      }

      // A product can be archived while it sits in a cart.
      for (const item of cart.items) {
        const product = await findProductById(item.productId)
        if (product?.status !== 'active') {
          const name = normalizeLocalizedField(item.name).en ?? item.productId
          throw new CommerceError(`${name} is no longer available.`, 'VALIDATION', 422)
        }
      }

      const orderStatus = options?.status ?? 'placed'
      const hasPhysicalItems = true
      const fulfillmentStatus = hasPhysicalItems ? 'unfulfilled' : 'not_required'

      const orderId = crypto.randomUUID()
      const orderNumber = generateOrderNumber()

      const subtotal = cart.totals.subtotal.amount
      const shippingCost = cart.totals.shipping?.amount ?? 0
      const tax = cart.totals.tax?.amount ?? 0
      const discount = cart.totals.discount?.amount ?? 0
      const total = subtotal + shippingCost + tax - discount

      const now = new Date()

      await dbCreateOrder({
        id: orderId,
        orderNumber,
        customerId: cart.customerId ?? null,
        contactEmail: options?.contactEmail ?? null,
        status: orderStatus,
        paymentStatus: total === 0 ? 'free' : 'unpaid',
        fulfillmentStatus,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        currency: await getStoreCurrency(),
        shippingAddress: cart.shippingAddress as any,
        billingAddress: cart.billingAddress as any,
        shippingMethod: cart.shippingMethod,
        paymentMethod: cart.paymentMethod,
        requiresShipping: true,
        placedAt: now,
      })

      for (const item of cart.items) {
        await createOrderItem({
          orderId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          name: typeof item.name === 'object' ? item.name : { en: String(item.name) },
          quantity: item.quantity,
          price: item.price.amount,
          totalPrice: item.totalPrice.amount,
          productType: 'physical',
          fulfillmentStatus: 'unfulfilled',
        })
      }

      await createOrderHistory({
        orderId,
        fromStatus: null,
        toStatus: orderStatus,
        note: 'Order placed',
      })

      if (!options?.keepCart) {
        await deleteCart(cartId)
      }

      const order = await findOrderById(orderId)
      if (!order) throw new Error(`Order not found after creation: ${orderId}`)
      return mapOrder(order)
    },
  }
}
