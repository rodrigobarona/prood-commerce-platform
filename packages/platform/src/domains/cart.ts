// ---------------------------------------------------------------------------
// Cart domain — cart CRUD and item management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Cart, AddToCartInput } from '@prood/types'
import {
  createCart as dbCreateCart,
  findCart,
  findCartItems,
  findExistingCartItem,
  insertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  updateCart,
  deleteCart,
  findProductById,
  findVariantById,
  findPrimaryImage,
} from '../database/index.js'
import { normalizeLocalizedField, discountablePrice, priceRequired, img, roundMoney, toNumber } from './helpers.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { requireSellable } from './availability.js'
import { previewCoupon } from './coupons.js'
import { listPaymentMethods, listShippingMethods } from './checkout-methods.js'

export function createCartDomain() {
  /** Build a full Cart object from cart row + items + product data */
  async function buildCart(cartId: string): Promise<Cart> {
    const cartRow = await findCart(cartId)
    if (!cartRow) throw new CommerceError(`Cart not found: ${cartId}`, "NOT_FOUND")

    const currency = await getStoreCurrency()
    const items = await findCartItems(cartId)
    let requiresShipping = false

    const cartItems = await Promise.all(items.map(async (item: any) => {
      const product = await findProductById(item.productId)
      const primaryImg = await findPrimaryImage(item.productId)
      if (product?.requiresShipping !== false) requiresShipping = true

      const variant = item.variantId ? await findVariantById(item.variantId) : null

      let itemPrice = toNumber(product?.price)
      let compareAt = product?.compareAtPrice

      if (variant?.price != null) {
        itemPrice = toNumber(variant.price)
        compareAt = variant.compareAtPrice
      }

      return {
        id: item.id,
        productId: item.productId,
        productSlug: product?.slug ?? undefined,
        variantId: item.variantId ?? null,
        name: product ? normalizeLocalizedField(product.name) : { en: 'Unknown' },
        variantName: variant?.name ? normalizeLocalizedField(variant.name) : undefined,
        image: primaryImg ? img(primaryImg.url, primaryImg.altText) : null,
        quantity: item.quantity,
        price: discountablePrice(itemPrice, compareAt, currency)!,
        totalPrice: priceRequired(roundMoney(itemPrice * item.quantity), currency),
      }
    }))

    const subtotal = roundMoney(cartItems.reduce((sum, item) => sum + item.totalPrice.amount, 0))

    // A method left on a cart whose last shipped item was removed charges nothing.
    const shippingMethod = requiresShipping
      ? listShippingMethods(currency).find(m => m.id === cartRow.shippingMethodId) ?? null
      : null
    const shipping = shippingMethod?.price.amount ?? 0
    const coupon = cartRow.couponCode
      ? await previewCoupon(cartRow.couponCode, {
          lines: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            totalPrice: item.totalPrice.amount,
          })),
          subtotal,
          shipping,
          currency,
          customerId: cartRow.customerId,
        })
      : null
    const discount = coupon?.discount ?? 0
    const paymentMethod = listPaymentMethods().find(m => m.id === cartRow.paymentMethodId) ?? null

    return {
      id: cartRow.id,
      items: cartItems,
      totals: {
        subtotal: priceRequired(subtotal, currency),
        shipping: shippingMethod?.price ?? null,
        tax: null,
        discount: discount > 0 ? priceRequired(discount, currency) : null,
        total: priceRequired(roundMoney(subtotal + shipping - discount), currency),
      },
      shippingAddress: cartRow.shippingAddress,
      billingAddress: cartRow.billingAddress,
      shippingMethod,
      paymentMethod,
      couponCode: cartRow.couponCode ?? null,
      couponError: coupon?.problem ?? null,
      requiresShipping,
      customerId: cartRow.customerId ?? null,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: cartRow.createdAt instanceof Date ? cartRow.createdAt.toISOString() : cartRow.createdAt,
      updatedAt: cartRow.updatedAt instanceof Date ? cartRow.updatedAt.toISOString() : cartRow.updatedAt,
    }
  }

  return {
    async createCart(): Promise<Cart> {
      const id = crypto.randomUUID()
      await dbCreateCart(id)
      return buildCart(id)
    },

    async getCart(cartId: string): Promise<Cart> {
      return buildCart(cartId)
    },

    async addToCart(cartId: string, item: AddToCartInput): Promise<Cart> {
      if (!(await findCart(cartId))) throw new CommerceError(`Cart not found: ${cartId}`, 'NOT_FOUND')

      const product = await findProductById(item.productId)
      if (product?.status !== 'active') {
        throw new CommerceError(`Product not found: ${item.productId}`, 'NOT_FOUND')
      }
      await requireSellable(product, item.variantId)

      const existing = await findExistingCartItem(cartId, item.productId, item.variantId)

      if (existing) {
        await updateCartItemQuantity(existing.id, existing.quantity + item.quantity)
      } else {
        await insertCartItem({
          cartId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })
      }

      await updateCart(cartId, { updatedAt: new Date() })
      return buildCart(cartId)
    },

    async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<Cart> {
      if (quantity <= 0) {
        await deleteCartItem(itemId)
      } else {
        await updateCartItemQuantity(itemId, quantity)
      }
      await updateCart(cartId, { updatedAt: new Date() })
      return buildCart(cartId)
    },

    async removeFromCart(cartId: string, itemId: string): Promise<Cart> {
      await deleteCartItem(itemId)
      await updateCart(cartId, { updatedAt: new Date() })
      return buildCart(cartId)
    },

    async applyCoupon(cartId: string, code: string): Promise<Cart> {
      await updateCart(cartId, { couponCode: code })
      const cart = await buildCart(cartId)
      // Throwing rolls the tenant transaction back, so the cart keeps what it had.
      if (cart.couponError) throw new CommerceError(cart.couponError, 'VALIDATION', 422)
      return cart
    },

    async removeCoupon(cartId: string): Promise<Cart> {
      await updateCart(cartId, { couponCode: null })
      return buildCart(cartId)
    },

    async deleteCart(cartId: string): Promise<void> {
      await deleteCart(cartId)
    },
  }
}
