import 'server-only'
import type { AddToCartInput, Cart } from '@commercejs/types'
import { getAdapter, runScoped } from './adapter'

/** Create a new empty cart. */
export async function createCart(tenantId?: string): Promise<Cart> {
  return runScoped(tenantId, async () => (await getAdapter()).createCart())
}

/** Fetch a cart by id. */
export async function getCart(cartId: string, tenantId?: string): Promise<Cart> {
  return runScoped(tenantId, async () => (await getAdapter()).getCart(cartId))
}

/** Add an item to a cart. */
export async function addToCart(
  cartId: string,
  item: AddToCartInput,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () => (await getAdapter()).addToCart(cartId, item))
}

/** Update a cart item's quantity. */
export async function updateCartItem(
  cartId: string,
  itemId: string,
  quantity: number,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).updateCartItem(cartId, itemId, quantity),
  )
}

/** Remove an item from a cart. */
export async function removeFromCart(
  cartId: string,
  itemId: string,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () => (await getAdapter()).removeFromCart(cartId, itemId))
}

/** Apply a coupon code to a cart. */
export async function applyCoupon(
  cartId: string,
  code: string,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () => (await getAdapter()).applyCoupon(cartId, code))
}

/** Remove the applied coupon from a cart. */
export async function removeCoupon(cartId: string, tenantId?: string): Promise<Cart> {
  return runScoped(tenantId, async () => (await getAdapter()).removeCoupon(cartId))
}
