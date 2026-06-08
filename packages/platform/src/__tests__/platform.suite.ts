// ---------------------------------------------------------------------------
// @prood/platform — shared test suite
// ---------------------------------------------------------------------------
// All adapter tests. Each driver test file calls this with its own setup.

import { it, expect, beforeEach } from 'vitest'
import { createPlatformAdapter } from '../adapter.js'
import { withTenant } from '../database/drizzle/client.js'
import { createCustomer } from '../database/drizzle/queries/customers.js'
import { DEMO_ORG_ID } from '../database/drizzle/seed.js'
import type { CommerceAdapter, Address } from '@prood/types'

/** Helper: create a full Address with all required fields */
function fullAddress(overrides: Partial<Address> = {}): Omit<Address, 'id' | 'isDefault'> {
  return {
    firstName: 'Ali',
    lastName: 'Ahmed',
    phone: null,
    street: '123 King Fahd Road',
    street2: null,
    city: 'Riyadh',
    state: null,
    country: 'SA',
    postalCode: '12345',
    district: null,
    nationalAddress: null,
    additionalNumber: null,
    ...overrides,
  }
}

export interface SuiteOptions {
  /** Called in beforeEach to init the DB, migrate, and seed */
  setup: () => void | Promise<void>
  /** Called in beforeEach (without seed) for auto-seed tests */
  setupEmpty: () => void | Promise<void>
}

export function platformTestSuite(opts: SuiteOptions, timeout = 30_000) {
  let adapter: CommerceAdapter & { setCurrentCustomer?: (id: string | null) => void }

  function scopedAdapter<T extends typeof adapter>(target: T): T {
    return new Proxy(target, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        if (prop === 'setCurrentCustomer') return value
        if (typeof value !== 'function') return value
        return (...args: unknown[]) =>
          withTenant(DEMO_ORG_ID, () => value.apply(target, args))
      },
    }) as T
  }

  beforeEach(async () => {
    await opts.setup()
    adapter = scopedAdapter((await createPlatformAdapter()).adapter as typeof adapter)
  })

  async function seedCustomer(firstName: string, lastName: string): Promise<string> {
    return withTenant(DEMO_ORG_ID, async () =>
      createCustomer({ firstName, lastName }),
    )
  }

  // ---- Catalog ----

  it('should list seeded products', async () => {
    const result = await adapter.getProducts({ page: 1, perPage: 10 })
    expect(result.products.items.length).toBe(3)
    expect(Number(result.products.total)).toBe(3)
  })

  it('should get a product by id', async () => {
    const result = await adapter.getProducts({ page: 1, perPage: 1 })
    const product = await adapter.getProduct({ id: result.products.items[0].id })
    expect(product.name.en).toBeTruthy()
    expect(product.name.pt).toBeTruthy()
    expect(product.name.es).toBeTruthy()
  })

  it('should get a product by slug', async () => {
    const product = await adapter.getProduct({ slug: 'premium-cotton-t-shirt' })
    expect(product.id).toBe('prod-1')
  })

  it('should include product variants', async () => {
    const product = await adapter.getProduct({ id: 'prod-1' })
    expect(product.variants?.length).toBeGreaterThan(0)
  })

  it('should include product images', async () => {
    const product = await adapter.getProduct({ id: 'prod-1' })
    expect(product.gallery?.length).toBeGreaterThan(0)
  })

  it('should search products by query', async () => {
    const result = await adapter.getProducts({ query: 'cotton', page: 1, perPage: 10 })
    expect(result.products.items.length).toBe(1)
    expect(result.products.items[0].slug).toBe('premium-cotton-t-shirt')
  })

  it('should filter by category', async () => {
    const result = await adapter.getProducts({ categoryId: 'cat-clothing', page: 1, perPage: 10 })
    expect(result.products.items.length).toBe(1)
  })

  it('should paginate', async () => {
    const page1 = await adapter.getProducts({ page: 1, perPage: 2 })
    const page2 = await adapter.getProducts({ page: 2, perPage: 2 })
    expect(page1.products.items.length).toBe(2)
    expect(page2.products.items.length).toBe(1)
  })

  it('should sort by price', async () => {
    const result = await adapter.getProducts({ page: 1, perPage: 10, sort: { field: 'price', direction: 'asc' } })
    const prices = result.products.items.map((p: any) => p.price.amount)
    expect(prices).toEqual([...prices].sort((a: number, b: number) => a - b))
  })

  it('should list categories', async () => {
    const categories = await adapter.getCategories({})
    expect(categories.length).toBe(3)
  })

  it('should throw for missing product', async () => {
    await expect(adapter.getProduct({ id: 'does-not-exist' })).rejects.toThrow()
  })

  // ---- Cart ----

  it('should create an empty cart', async () => {
    const cart = await adapter.createCart()
    expect(cart.id).toBeTruthy()
    expect(cart.items).toHaveLength(0)
    expect(cart.totals.subtotal.amount).toBe(0)
  })

  it('should add item to cart', async () => {
    const cart = await adapter.createCart()
    const updatedCart = await adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 2 })
    expect(updatedCart.items).toHaveLength(1)
    expect(updatedCart.items[0].quantity).toBe(2)
    expect(updatedCart.totals.subtotal.amount).toBeGreaterThan(0)
  })

  it('should deduplicate items on add', async () => {
    const cart = await adapter.createCart()
    await adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 1 })
    const updatedCart = await adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 3 })
    expect(updatedCart.items).toHaveLength(1)
    expect(updatedCart.items[0].quantity).toBe(4)
  })

  it('should update cart item quantity', async () => {
    const cart = await adapter.createCart()
    const added = await adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 1 })
    const updatedCart = await adapter.updateCartItem(cart.id, added.items[0].id, 5)
    expect(updatedCart.items[0].quantity).toBe(5)
  })

  it('should remove cart item', async () => {
    const cart = await adapter.createCart()
    const added = await adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 1 })
    const updatedCart = await adapter.removeFromCart(cart.id, added.items[0].id)
    expect(updatedCart.items).toHaveLength(0)
  })

  it('should apply and remove coupon', async () => {
    const cart = await adapter.createCart()
    const withCoupon = await adapter.applyCoupon(cart.id, 'SAVE10')
    expect(withCoupon.couponCode).toBe('SAVE10')
    const noCoupon = await adapter.removeCoupon(cart.id)
    expect(noCoupon.couponCode).toBeNull()
  })

  it('should use variant price when variant is specified', async () => {
    const product = await adapter.getProduct({ id: 'prod-1' })
    const variant = product.variants?.find((v: any) => v.name?.en === 'Large')
    expect(variant).toBeTruthy()
    const cart = await adapter.createCart()
    const updatedCart = await adapter.addToCart(cart.id, {
      productId: 'prod-1',
      variantId: variant!.id,
      quantity: 1,
    })
    expect(updatedCart.items[0].price.amount).toBe(variant!.price!.amount)
  })

  // ---- Checkout ----

  it('should list shipping methods', async () => {
    const methods = await adapter.getShippingMethods('dummy-cart')
    expect(methods.length).toBeGreaterThan(0)
  })

  it('should list payment methods', async () => {
    const methods = await adapter.getPaymentMethods('dummy-cart')
    expect(methods.length).toBeGreaterThan(0)
  })

  it('should set shipping address', async () => {
    const cart = await adapter.createCart()
    const updatedCart = await adapter.setShippingAddress(cart.id, fullAddress())
    expect(updatedCart.id).toBe(cart.id)
  })

  it('should place an order from cart', async () => {
    const cart = await adapter.createCart()
    await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
    await adapter.setShippingAddress(cart.id, fullAddress())
    const order = await adapter.placeOrder(cart.id)
    expect(order.id).toBeTruthy()
    expect(order.orderNumber).toBeTruthy()
    expect(order.status).toBe('placed')
    expect(order.items.length).toBe(1)
    expect(order.totals.total.amount).toBeGreaterThan(0)
  })

  it('should reject placing order with empty cart', async () => {
    const cart = await adapter.createCart()
    await expect(adapter.placeOrder(cart.id)).rejects.toThrow()
  })

  // ---- Orders ----

  it('should create an order directly', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
      shippingAddress: fullAddress(),
    })
    expect(order.id).toBeTruthy()
    expect(order.status).toBe('placed')
  })

  it('should get an order by id', async () => {
    const created = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
      shippingAddress: fullAddress(),
    })
    const order = await adapter.getOrder(created.id)
    expect(order.id).toBe(created.id)
  })

  it('should list order statuses', async () => {
    const statuses = await adapter.getOrderStatuses()
    expect(statuses.length).toBeGreaterThan(0)
    expect(statuses.find((s: any) => s.id === 'placed')).toBeTruthy()
  })

  it('should update order status', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
      shippingAddress: fullAddress(),
    })
    await adapter.updateOrderStatus(order.id, { status: 'approved' })
    const updated = await adapter.getOrder(order.id)
    expect(updated.status).toBe('approved')
  })

  it('should track order history', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
      shippingAddress: fullAddress(),
    })
    await adapter.updateOrderStatus(order.id, { status: 'approved' })
    const history = await adapter.getOrderHistory(order.id)
    expect(history.length).toBeGreaterThanOrEqual(2)
  })

  it('should cancel an order', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
      shippingAddress: fullAddress(),
    })
    await adapter.cancelOrder(order.id, 'Changed my mind')
    const cancelled = await adapter.getOrder(order.id)
    expect(cancelled.status).toBe('cancelled')
  })

  it('should duplicate an order', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: { amount: 100, currency: 'SAR', formatted: '100 SAR' } }],
      shippingAddress: fullAddress(),
    })
    const dup = await adapter.duplicateOrder(order.id)
    expect(dup.id).not.toBe(order.id)
    expect(dup.items.length).toBe(order.items.length)
  })

  // ---- Store ----

  it('should return store info', async () => {
    const info = await adapter.getStoreInfo()
    expect(info.name.en).toBeTruthy()
    expect(info.currencies.length).toBeGreaterThan(0)
    expect(info.locales.length).toBeGreaterThan(0)
    expect(info.country).toBe('SA')
  })

  it('should auto-seed default store info when none exists', async () => {
    // Create fresh DB without seed
    await opts.setupEmpty()
    const freshAdapter = (await createPlatformAdapter()).adapter
    const info = await withTenant(DEMO_ORG_ID, async () => freshAdapter.getStoreInfo())
    expect(info.name.en).toBe('My Store')
  })

  it('should provision store info when an organization is created', async () => {
    const { provisionOrganizationStore } = await import('../tenant/store-info.js')
    const { findStoreInfo } = await import('../database/drizzle/queries/store.js')
    const orgId = 'org_provision_test'

    await provisionOrganizationStore(orgId, { name: 'Acme Store' })

    await withTenant(orgId, async () => {
      const row = await findStoreInfo('default')
      expect(row?.name).toEqual({ en: 'Acme Store' })
    })
  })

  // ---- Customers (auth via Better Auth; adapter exposes address book only) ----

  it('should reject register — handled by Better Auth', async () => {
    await expect(async () => {
      await adapter.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      })
    }).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
  })

  it('should reject login — handled by Better Auth', async () => {
    await expect(async () => {
      await adapter.login('login@example.com', 'Password123!')
    }).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
  })

  it('should reject forgotPassword — handled by Better Auth', async () => {
    await expect(async () => {
      await adapter.forgotPassword('test@example.com')
    }).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
  })

  it('should manage addresses when a customer session is set', async () => {
    const customerId = await seedCustomer('Addr', 'User')
    adapter.setCurrentCustomer!(customerId)

    // Add
    const addr = await adapter.addAddress(fullAddress())
    expect(addr.id).toBeTruthy()
    expect(addr.city).toBe('Riyadh')

    // List
    const list = await adapter.getAddresses()
    expect(list.length).toBe(1)

    // Update
    const updated = await adapter.updateAddress(addr.id, { city: 'Jeddah' })
    expect(updated.city).toBe('Jeddah')

    // Delete
    await adapter.deleteAddress(addr.id)
    const afterDelete = await adapter.getAddresses()
    expect(afterDelete.length).toBe(0)
  })

  // ---- Not-supported domains ----

  // ---- Promotions ----

  it('should return empty promotions list', async () => {
    const promos = await adapter.getActivePromotions()
    expect(Array.isArray(promos)).toBe(true)
    expect(promos.length).toBe(0)
  })

  it('should return null for unknown coupon', async () => {
    const coupon = await adapter.validateCoupon('FAKE')
    expect(coupon).toBeNull()
  })

  // ---- Returns ----

  it('should return empty returns list', async () => {
    const result = await adapter.getReturns()
    expect(result.items.length).toBe(0)
    expect(result.total).toBe(0)
  })

  // ---- Reviews ----

  it('should submit and retrieve reviews', async () => {
    const review = await adapter.submitReview({
      productId: 'prod-1',
      authorName: 'Ali',
      rating: 5,
      title: 'Great product',
      body: 'Really liked it',
    })
    expect(review.rating).toBe(5)
    expect(review.authorName).toBe('Ali')

    const result = await adapter.getProductReviews('prod-1')
    // 3 seeded reviews + 1 submitted
    expect(result.items.length).toBe(4)
    expect(result.total).toBe(4)

    const summary = await adapter.getReviewSummary('prod-1')
    // (5+4+5+5)/4 = 4.75 → 4.8
    expect(summary.averageRating).toBe(4.8)
    expect(summary.totalCount).toBe(4)
    // distribution[4] (5-star) should be 3 (Ahmed, Omar, Ali), distribution[3] (4-star) = 1 (Sara)
    expect(summary.distribution[4]).toBe(3)
    expect(summary.distribution[3]).toBe(1)
  })

  // ---- Wishlist ----

  it('should add and remove wishlist items', async () => {
    const customerId = await seedCustomer('Wish', 'User')

    // Get wishlist (auto-created, empty)
    const wl = await adapter.getWishlist(customerId)
    expect(wl.items).toHaveLength(0)
    expect(wl.itemCount).toBe(0)

    // Add item
    const updated = await adapter.addToWishlist('prod-1', undefined, customerId)
    expect(updated.items).toHaveLength(1)
    expect(updated.itemCount).toBe(1)

    // Dedup — adding same product again should not duplicate
    const dedup = await adapter.addToWishlist('prod-1', undefined, customerId)
    expect(dedup.items).toHaveLength(1)

    // Remove
    const removed = await adapter.removeFromWishlist('prod-1', customerId)
    expect(removed.items).toHaveLength(0)
  })

  // ---- Brands ----

  it('should return seeded brands', async () => {
    const brands = await adapter.getBrands()
    expect(Array.isArray(brands)).toBe(true)
    expect(brands.length).toBe(3)
    const names = brands.map((b: any) => b.name.en)
    expect(names).toContain('Prood Essentials')
    expect(names).toContain('TechWave')
    expect(names).toContain('Artisan Leather')
  })

  // ---- Countries ----

  it('should return seeded countries', async () => {
    const countries = await adapter.getCountries()
    expect(Array.isArray(countries)).toBe(true)
    expect(countries.length).toBe(6)
    const codes = countries.map((c: any) => c.code)
    expect(codes).toContain('SA')
    expect(codes).toContain('AE')
    expect(codes).toContain('KW')
  })

  // ---- Capabilities ----

  it('should report supported domains', async () => {
    const caps = adapter.capabilities
    expect(caps).toContain('catalog')
    expect(caps).toContain('cart')
    expect(caps).toContain('checkout')
    expect(caps).toContain('brands')
    expect(caps).toContain('countries')
    expect(caps).toContain('wishlist')
    expect(caps).toContain('reviews')
    expect(caps).toContain('promotions')
    expect(caps).toContain('returns')
  })

  it('should have correct adapter name', async () => {
    expect(adapter.name).toBe('prood')
  })
}
