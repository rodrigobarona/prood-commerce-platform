// ---------------------------------------------------------------------------
// @prood/platform — shared test suite
// ---------------------------------------------------------------------------
// All adapter tests. Each driver test file calls this with its own setup.

import { describe, it, expect, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { createPlatformAdapter } from '../adapter.js'
import { getDb, withTenant } from '../database/drizzle/client.js'
import { createCustomer } from '../database/drizzle/queries/customers.js'
import { DEMO_ORG_ID } from '../database/drizzle/seed.js'
import type { PlatformAdapter } from '../adapter.js'
import type { CheckoutAddress, Order, PaginationParams } from '@prood/types'

/** Helper: create a full Address with all required fields */
function fullAddress(overrides: Partial<CheckoutAddress> = {}): CheckoutAddress {
  return {
    firstName: 'Ana',
    lastName: 'Silva',
    phone: null,
    street: 'Rua Augusta 100',
    street2: null,
    city: 'Lisboa',
    state: null,
    country: 'PT',
    postalCode: '1100-053',
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
  let adapter: PlatformAdapter

  function scopedAdapter(target: PlatformAdapter): PlatformAdapter {
    return new Proxy(target, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        if (prop === 'setCurrentCustomer') return value
        if (typeof value !== 'function') return value
        return (...args: unknown[]) =>
          withTenant(DEMO_ORG_ID, () => value.apply(target, args))
      },
    })
  }

  beforeEach(async () => {
    await opts.setup()
    adapter = scopedAdapter((await createPlatformAdapter()).adapter)
  })

  async function seedCustomer(firstName: string, lastName: string): Promise<string> {
    return withTenant(DEMO_ORG_ID, async () =>
      createCustomer({ firstName, lastName }),
    )
  }

  async function placedOrder(options?: { customerId?: string }) {
    const cart = await adapter.createCart()
    await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
    await adapter.setShippingAddress(cart.id, fullAddress())
    return adapter.placeOrder(cart.id, options)
  }

  async function capture(order: Order) {
    const { amount, currency } = order.totals.total
    return adapter.applyPaymentEvent(order.id, { outcome: 'captured', amount, currency, provider: 'test' })
  }

  async function asTenant<T>(fn: (admin: Awaited<ReturnType<typeof createPlatformAdapter>>['admin']) => Promise<T>) {
    const { admin } = await createPlatformAdapter()
    return withTenant(DEMO_ORG_ID, () => fn(admin))
  }

  // ---- Catalog ----

  it('should list seeded products', async () => {
    const result = await adapter.getProducts({ page: 1, perPage: 10 })
    expect(result.products.items.length).toBe(3)
    expect(result.products.total).toBe(3)
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

  it('returns the same product from every read path', async () => {
    const product = await adapter.getProduct({ id: 'prod-1' })
    const listed = await adapter.getProducts({ page: 1, perPage: 10 })
    const admin = await asTenant(async (admin) => ({
      product: await admin.getProduct('prod-1'),
      list: await admin.listProducts({}),
      lowStock: await admin.getLowStockProducts(1000),
    }))

    expect(typeof product.createdAt).toBe('string')
    expect(listed.products.items.find(p => p.id === 'prod-1')).toEqual(product)
    expect(admin.product).toEqual(product)
    expect(admin.list.items.find(p => p.id === 'prod-1')).toEqual(product)
    expect(admin.lowStock.find(p => p.id === 'prod-1')).toEqual(product)
  })

  describe('store currency', () => {
    it('prices products, carts, shipping and orders in the store currency', async () => {
      await asTenant((admin) => admin.updateStoreSettings({ currency: 'USD' }))

      const product = await adapter.getProduct({ id: 'prod-1' })
      expect(product.price?.currency).toBe('USD')
      expect(product.variants[0]?.price?.currency).toBe('USD')
      const listed = await adapter.getProducts({ page: 1, perPage: 10 })
      expect(listed.products.items.every(p => p.price?.currency === 'USD')).toBe(true)
      expect((await asTenant((admin) => admin.getProduct('prod-1'))).price?.currency).toBe('USD')

      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      const [method] = await adapter.getShippingMethods(cart.id)
      expect(method?.price.currency).toBe('USD')
      await adapter.setShippingAddress(cart.id, fullAddress())
      const withShipping = await adapter.setShippingMethod(cart.id, method!.id)
      for (const amount of [
        withShipping.items[0]?.price,
        withShipping.items[0]?.totalPrice,
        withShipping.totals.subtotal,
        withShipping.totals.shipping,
        withShipping.totals.total,
      ]) {
        expect(amount?.currency).toBe('USD')
      }

      const order = await adapter.placeOrder(cart.id)
      expect(order.totals.total.currency).toBe('USD')
      expect(await capture(order)).toBe('applied')
    })

    it('keeps the currency once the store has sold, so revenue is never mixed', async () => {
      await asTenant((admin) => admin.updateStoreSettings({ currency: 'USD' }))
      await placedOrder()

      await expect(
        asTenant((admin) => admin.updateStoreSettings({ currency: 'EUR' })),
      ).rejects.toMatchObject({ code: 'VALIDATION' })
      const settings = await asTenant((admin) => admin.updateStoreSettings({ currency: 'USD', country: 'US' }))
      expect(settings).toMatchObject({ currency: 'USD', country: 'US' })
    })

    it('leaves no product-level currency to diverge', async () => {
      const { rows } = await withTenant(DEMO_ORG_ID, () =>
        getDb().execute(sql`
          select column_name from information_schema.columns
          where table_name = 'products' and column_name = 'currency'
        `),
      )
      expect(rows).toHaveLength(0)
    })
  })

  it('rates a product from its reviews', async () => {
    const before = await adapter.getProduct({ id: 'prod-1' })
    expect(before.rating).toEqual({ average: 4.7, count: 3 })

    await adapter.submitReview({ productId: 'prod-1', authorName: 'Rui', rating: 5 })
    const after = await adapter.getProducts({ page: 1, perPage: 10 })
    const summary = await adapter.getReviewSummary('prod-1')
    const rating = after.products.items.find(p => p.id === 'prod-1')?.rating
    expect(rating).toEqual({ average: summary.averageRating, count: summary.totalCount })
  })

  it('leaves an unreviewed product unrated', async () => {
    await withTenant(DEMO_ORG_ID, () =>
      getDb().execute(sql`delete from reviews where product_id = 'prod-3'`),
    )
    expect((await adapter.getProduct({ id: 'prod-3' })).rating).toBeNull()
  })

  it('exposes no field the platform has no data for', async () => {
    const product = await adapter.getProduct({ id: 'prod-1' })
    for (const field of ['options', 'digital', 'service', 'event', 'subscription', 'preOrder']) {
      expect(product).not.toHaveProperty(field)
    }
    expect(product.variants[0]).not.toHaveProperty('attributes')

    const order = await placedOrder()
    expect(order.items[0]).not.toHaveProperty('digital')
    expect(order.items[0]).not.toHaveProperty('event')
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
    const updatedCart = await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 2 })
    expect(updatedCart.items).toHaveLength(1)
    expect(updatedCart.items[0].quantity).toBe(2)
    expect(updatedCart.totals.subtotal.amount).toBeGreaterThan(0)
  })

  it('should deduplicate items on add', async () => {
    const cart = await adapter.createCart()
    await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
    const updatedCart = await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 3 })
    expect(updatedCart.items).toHaveLength(1)
    expect(updatedCart.items[0].quantity).toBe(4)
  })

  it('should update cart item quantity', async () => {
    const cart = await adapter.createCart()
    const added = await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
    const updatedCart = await adapter.updateCartItem(cart.id, added.items[0].id, 5)
    expect(updatedCart.items[0].quantity).toBe(5)
  })

  it('should remove cart item', async () => {
    const cart = await adapter.createCart()
    const added = await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
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

  describe('variants', () => {
    async function setVariant(id: string, values: 'in_stock = false' | 'inventory_quantity = 0' | 'price = null') {
      await withTenant(DEMO_ORG_ID, () =>
        getDb().execute(sql`update product_variants set ${sql.raw(values)} where id = ${id}`),
      )
    }

    it('names the chosen variant on the cart line', async () => {
      const cart = await adapter.createCart()
      const updated = await adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-l', quantity: 1 })
      expect(updated.items[0]?.variantName?.en).toBe('Large')
      expect(updated.totals.subtotal.amount).toBe(32)
    })

    it('keeps different variants of a product on separate lines', async () => {
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-s', quantity: 1 })
      const updated = await adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-l', quantity: 1 })
      expect(updated.items).toHaveLength(2)
      expect(updated.totals.subtotal.amount).toBe(29 + 32)
    })

    it('sells a variant without a price at the base price', async () => {
      await setVariant('var-tshirt-m', 'price = null')
      const cart = await adapter.createCart()
      const updated = await adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-m', quantity: 2 })
      expect(updated.totals.subtotal.amount).toBe(58)
    })

    it('refuses a variant of another product', async () => {
      const cart = await adapter.createCart()
      await expect(
        adapter.addToCart(cart.id, { productId: 'prod-2', variantId: 'var-tshirt-l', quantity: 1 }),
      ).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(
        adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-none', quantity: 1 }),
      ).rejects.toMatchObject({ code: 'VALIDATION' })
      expect((await adapter.getCart(cart.id)).items).toHaveLength(0)
    })

    it('refuses a product with variants when none is chosen', async () => {
      const cart = await adapter.createCart()
      await expect(
        adapter.addToCart(cart.id, { productId: 'prod-1', quantity: 1 }),
      ).rejects.toMatchObject({ code: 'VALIDATION' })
    })

    it('refuses a sold out variant, however stock is tracked', async () => {
      await setVariant('var-tshirt-s', 'in_stock = false')
      await setVariant('var-tshirt-m', 'inventory_quantity = 0')
      const cart = await adapter.createCart()
      for (const variantId of ['var-tshirt-s', 'var-tshirt-m']) {
        await expect(
          adapter.addToCart(cart.id, { productId: 'prod-1', variantId, quantity: 1 }),
        ).rejects.toMatchObject({ code: 'VALIDATION' })
      }
      const product = await adapter.getProduct({ id: 'prod-1' })
      expect(product.variants.map(v => v.inStock)).toEqual([false, false, true])
    })

    it('refuses a product without stock or a price', async () => {
      await withTenant(DEMO_ORG_ID, () =>
        getDb().execute(sql`update products set in_stock = false where id = 'prod-2'`),
      )
      await withTenant(DEMO_ORG_ID, () =>
        getDb().execute(sql`update products set price = null where id = 'prod-3'`),
      )
      const cart = await adapter.createCart()
      for (const productId of ['prod-2', 'prod-3']) {
        await expect(adapter.addToCart(cart.id, { productId, quantity: 1 })).rejects.toMatchObject({ code: 'VALIDATION' })
      }
    })

    it('does not place an order for a variant that sold out in the cart', async () => {
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-l', quantity: 1 })
      await adapter.setShippingAddress(cart.id, fullAddress())
      await adapter.setShippingMethod(cart.id, 'standard')
      await setVariant('var-tshirt-l', 'in_stock = false')
      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({ code: 'VALIDATION' })
    })
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

  describe('checkout methods', () => {
    async function cartWithItem() {
      const cart = await adapter.createCart()
      return adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
    }

    it('returns the methods selected on the cart', async () => {
      const cart = await cartWithItem()
      const [, express] = await adapter.getShippingMethods(cart.id)
      const [, cod] = await adapter.getPaymentMethods(cart.id)

      await adapter.setShippingMethod(cart.id, express!.id)
      await adapter.setPaymentMethod(cart.id, cod!.id)

      const updated = await adapter.getCart(cart.id)
      expect(updated.shippingMethod).toEqual(express)
      expect(updated.paymentMethod).toEqual(cod)
    })

    it('leaves the cart without methods until one is selected', async () => {
      const cart = await cartWithItem()
      expect(cart.shippingMethod).toBeNull()
      expect(cart.paymentMethod).toBeNull()
      expect(cart.totals.shipping).toBeNull()
    })

    it('charges in the cart what checkout offers, for every shipping method', async () => {
      const cart = await cartWithItem()
      for (const method of await adapter.getShippingMethods(cart.id)) {
        const updated = await adapter.setShippingMethod(cart.id, method.id)
        expect(updated.totals.shipping).toEqual(method.price)
        expect(updated.totals.total.amount).toBe(cart.totals.subtotal.amount + method.price.amount)
      }
    })

    it('refuses a method the store does not offer', async () => {
      const cart = await cartWithItem()
      await expect(adapter.setShippingMethod(cart.id, 'free-please')).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(adapter.setPaymentMethod(cart.id, 'iou')).rejects.toMatchObject({ code: 'VALIDATION' })
      expect((await adapter.getCart(cart.id)).totals.shipping).toBeNull()
    })

    it('keeps on the order the methods chosen and the shipping charged', async () => {
      const cart = await cartWithItem()
      const [, express] = await adapter.getShippingMethods(cart.id)
      const [, cod] = await adapter.getPaymentMethods(cart.id)
      await adapter.setShippingMethod(cart.id, express!.id)
      await adapter.setPaymentMethod(cart.id, cod!.id)
      await adapter.setShippingAddress(cart.id, fullAddress())

      const placed = await adapter.placeOrder(cart.id)

      for (const order of [placed, await adapter.getOrder(placed.id)]) {
        expect(order.shippingMethod).toEqual(express)
        expect(order.paymentMethod).toEqual(cod)
        expect(order.totals.shipping).toEqual(express!.price)
        expect(order.totals.total.amount).toBe(order.totals.subtotal.amount + express!.price.amount)
      }
    })

    it('invents no method for an order placed without one', async () => {
      const order = await adapter.getOrder((await placedOrder()).id)
      expect(order.shippingMethod).toBeNull()
      expect(order.paymentMethod).toBeNull()
    })
  })

  describe('order reads', () => {
    it('returns the same order from every read path', async () => {
      const customerId = await seedCustomer('Read', 'Paths')
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      await adapter.setShippingMethod(cart.id, 'standard')
      await adapter.setPaymentMethod(cart.id, 'card')
      await adapter.setShippingAddress(cart.id, fullAddress())
      const placed = await adapter.placeOrder(cart.id, { customerId })

      const order = await adapter.getOrder(placed.id)
      const customerOrders = await adapter.getCustomerOrders({ customerId })
      const admin = await asTenant(async (admin) => ({
        order: await admin.getOrder(placed.id),
        list: await admin.listOrders({}),
        stats: await admin.getDashboardStats(),
      }))

      expect(typeof order.createdAt).toBe('string')
      expect(typeof order.placedAt).toBe('string')
      expect(placed).toEqual(order)
      expect(customerOrders.items[0]).toEqual(order)
      expect(admin.order).toEqual(order)
      expect(admin.list.items[0]).toEqual(order)
      expect(admin.stats.recentOrders[0]).toEqual(order)
    })

    it('prices an order in the currency it was charged in', async () => {
      const placed = await placedOrder()
      await withTenant(DEMO_ORG_ID, () =>
        getDb().execute(sql`update orders set currency = 'USD' where id = ${placed.id}`),
      )
      const order = await adapter.getOrder(placed.id)
      expect(order.totals.total.currency).toBe('USD')
      expect(order.items[0]?.price.currency).toBe('USD')
    })

    it('counts all of a customer\'s orders, not just the current page', async () => {
      const customerId = await seedCustomer('Many', 'Orders')
      const other = await seedCustomer('Other', 'Customer')
      await placedOrder({ customerId })
      await placedOrder({ customerId })
      await placedOrder({ customerId })
      await placedOrder({ customerId: other })

      const list = (params: PaginationParams) =>
        adapter.getCustomerOrders({ ...params, customerId })

      const first = await list({ page: 1, perPage: 2 })
      expect(first.items).toHaveLength(2)
      expect(first).toMatchObject({ total: 3, hasMore: true })

      const last = await list({ page: 2, perPage: 2 })
      expect(last.items).toHaveLength(1)
      expect(last).toMatchObject({ total: 3, hasMore: false })

      // A full last page used to report more to come.
      expect(await list({ page: 1, perPage: 3 })).toMatchObject({ total: 3, hasMore: false })
    })
  })

  describe('admin aggregates', () => {
    // Postgres returns bigint and numeric aggregates as strings, so the API
    // would send "3" where the contract promises a number.
    it('returns counts and revenue as numbers', async () => {
      const order = await placedOrder()
      await capture(order)

      const { stats, products, orders } = await asTenant(async (admin) => ({
        stats: await admin.getDashboardStats(),
        products: await admin.listProducts({}),
        orders: await admin.listOrders({}),
      }))

      expect(products.total).toBe(3)
      expect(orders.total).toBe(1)
      expect(stats.totalProducts).toBe(3)
      expect(stats.activeProducts).toBe(3)
      expect(stats.totalOrders).toBe(1)
      expect(stats.totalCustomers).toBe(0)
      expect(stats.totalRevenue).toBe(order.totals.total.amount)
      expect(stats.ordersByStatus).toEqual({ approved: 1 })
    })

    it('counts as revenue only the money received', async () => {
      const revenue = () => asTenant(async (admin) => (await admin.getDashboardStats()).totalRevenue)

      const paid = await placedOrder()
      await capture(paid)
      const expected = paid.totals.total.amount

      await placedOrder()
      const cancelled = await placedOrder()
      await adapter.cancelOrder(cancelled.id)
      const authorized = await placedOrder()
      await adapter.applyPaymentEvent(authorized.id, { outcome: 'authorized', amount: null, currency: null, provider: 'test' })
      expect(await revenue()).toBe(expected)

      const refunded = await placedOrder()
      await capture(refunded)
      expect(await revenue()).toBe(expected + refunded.totals.total.amount)
      await asTenant((admin) => admin.refundOrder(refunded.id))
      expect(await revenue()).toBe(expected)
    })

    it('keeps a partly refunded order in revenue', async () => {
      const order = await placedOrder()
      await capture(order)
      await adapter.updateOrderStatus(order.id, { status: 'approved', paymentStatus: 'partially_refunded' })
      const { totalRevenue } = await asTenant((admin) => admin.getDashboardStats())
      expect(totalRevenue).toBe(order.totals.total.amount)
    })

    it('counts a late payment on a cancelled order until it is refunded', async () => {
      const order = await placedOrder()
      await adapter.cancelOrder(order.id)
      await capture(order)
      const { totalRevenue } = await asTenant((admin) => admin.getDashboardStats())
      expect(totalRevenue).toBe(order.totals.total.amount)
    })
  })

  describe('payment events', () => {
    const provider = 'test'

    it('captures a payment of the order total, once', async () => {
      const order = await placedOrder()
      const { amount, currency } = order.totals.total
      const event = { outcome: 'captured' as const, amount, currency, provider }
      expect(await adapter.applyPaymentEvent(order.id, event)).toBe('applied')
      expect(await adapter.applyPaymentEvent(order.id, event)).toBe('duplicate')
      expect((await adapter.getOrder(order.id)).status).toBe('approved')
    })

    it('refuses a payment for a fraction of the total', async () => {
      const order = await placedOrder()
      const { amount, currency } = order.totals.total
      expect(
        await adapter.applyPaymentEvent(order.id, { outcome: 'captured', amount: amount / 100, currency, provider }),
      ).toBe('amount_mismatch')
      expect((await adapter.getOrder(order.id)).status).toBe('placed')
    })

    it('keeps a cancelled order cancelled when a late payment arrives, once', async () => {
      const order = await placedOrder()
      const { amount, currency } = order.totals.total
      const event = { outcome: 'captured' as const, amount, currency, provider }
      await adapter.cancelOrder(order.id)
      expect(await adapter.applyPaymentEvent(order.id, event)).toBe('order_cancelled')
      expect(await adapter.applyPaymentEvent(order.id, event)).toBe('duplicate')
      const after = await adapter.getOrder(order.id)
      expect(after.status).toBe('cancelled')
      expect(after.paymentStatus).toBe('paid')
    })

    it('ignores an authorization on a cancelled order', async () => {
      const order = await placedOrder()
      await adapter.cancelOrder(order.id)
      expect(
        await adapter.applyPaymentEvent(order.id, { outcome: 'authorized', amount: null, currency: null, provider }),
      ).toBe('duplicate')
    })

    it('never moves a shipped order', async () => {
      const paid = await placedOrder()
      const { amount, currency } = paid.totals.total
      await adapter.updateOrderStatus(paid.id, { status: 'fulfilled' })
      expect(
        await adapter.applyPaymentEvent(paid.id, { outcome: 'captured', amount, currency, provider }),
      ).toBe('applied')
      expect((await adapter.getOrder(paid.id)).status).toBe('fulfilled')

      const failed = await placedOrder()
      await adapter.updateOrderStatus(failed.id, { status: 'fulfilled' })
      await adapter.applyPaymentEvent(failed.id, { outcome: 'failed', amount: null, currency: null, provider })
      expect((await adapter.getOrder(failed.id)).status).toBe('fulfilled')
    })
  })

  it('should reject placing order with empty cart', async () => {
    const cart = await adapter.createCart()
    await expect(adapter.placeOrder(cart.id)).rejects.toThrow()
  })

  // ---- Orders ----

  it('should create an order directly', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
      shippingAddress: fullAddress(),
    })
    expect(order.id).toBeTruthy()
    expect(order.status).toBe('placed')
  })

  it('should get an order by id', async () => {
    const created = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
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
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
      shippingAddress: fullAddress(),
    })
    await adapter.updateOrderStatus(order.id, { status: 'approved' })
    const updated = await adapter.getOrder(order.id)
    expect(updated.status).toBe('approved')
  })

  it('should track order history', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
      shippingAddress: fullAddress(),
    })
    await adapter.updateOrderStatus(order.id, { status: 'approved' })
    const history = await adapter.getOrderHistory(order.id)
    expect(history.length).toBeGreaterThanOrEqual(2)
  })

  it('should cancel an order', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
      shippingAddress: fullAddress(),
    })
    await adapter.cancelOrder(order.id, 'Changed my mind')
    const cancelled = await adapter.getOrder(order.id)
    expect(cancelled.status).toBe('cancelled')
  })

  it('should duplicate an order', async () => {
    const order = await adapter.createOrder({
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
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
    expect(info.country).toBe('PT')
  })

  it('reads the store country from its stored settings', async () => {
    const settings = await asTenant((admin) => admin.updateStoreSettings({ country: 'ES' }))
    expect(settings.country).toBe('ES')
    expect((await adapter.getStoreInfo()).country).toBe('ES')
  })

  it('stores social links as the record it returns', async () => {
    const socialLinks = { instagram: 'https://instagram.com/prood' }
    const updated = await asTenant((admin) => admin.updateStoreSettings({ socialLinks }))
    expect(updated.socialLinks).toEqual(socialLinks)
    expect((await asTenant((admin) => admin.getStoreSettings())).socialLinks).toEqual(socialLinks)
  })

  it('should auto-seed default store info when none exists', async () => {
    // Create fresh DB without seed
    await opts.setupEmpty()
    const freshAdapter = (await createPlatformAdapter()).adapter
    const info = await withTenant(DEMO_ORG_ID, async () => freshAdapter.getStoreInfo())
    expect(info.name.en).toBe('My Store')
    expect(info.country).toBe('PT')
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
    adapter.setCurrentCustomer(customerId)

    // Add
    const addr = await adapter.addAddress(fullAddress())
    expect(addr.id).toBeTruthy()
    expect(addr.city).toBe('Lisboa')

    // List
    const list = await adapter.getAddresses()
    expect(list.length).toBe(1)

    // Update
    const updated = await adapter.updateAddress(addr.id, { city: 'Porto' })
    expect(updated.city).toBe('Porto')

    // Delete
    await adapter.deleteAddress(addr.id)
    const afterDelete = await adapter.getAddresses()
    expect(afterDelete.length).toBe(0)
  })

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
    expect(codes).toContain('PT')
    expect(codes).toContain('ES')
    expect(codes).toContain('DE')
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
