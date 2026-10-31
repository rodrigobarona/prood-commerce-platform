// ---------------------------------------------------------------------------
// @prood/platform — shared test suite
// ---------------------------------------------------------------------------
// All adapter tests. Each driver test file calls this with its own setup.

import { describe, it, expect, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { createPlatformAdapter } from '../adapter.js'
import { getDb, withTenant } from '../database/drizzle/client.js'
import { createCustomer } from '../database/drizzle/queries/customers.js'
import { coupons, promotions } from '../database/drizzle/schema/promotions.js'
import { DEMO_ORG_ID } from '../database/drizzle/seed.js'
import type { PlatformAdapter } from '../adapter.js'
import type { CheckoutAddress, CreateOrderInput, Order, PaginationParams } from '@prood/types'

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

  /** A cart with one earbuds line (79.00), ready for placeOrder. */
  async function readyCart() {
    const cart = await adapter.createCart()
    await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
    await adapter.setShippingAddress(cart.id, fullAddress())
    return adapter.setShippingMethod(cart.id, 'standard')
  }

  async function placedOrder(options?: { customerId?: string; contactEmail?: string }) {
    return adapter.placeOrder((await readyCart()).id, options)
  }

  function directOrder(overrides: Partial<CreateOrderInput> = {}) {
    return adapter.createOrder({
      items: [{ productId: 'prod-2', quantity: 2, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
      shippingAddress: fullAddress(),
      shippingMethodId: 'standard',
      ...overrides,
    })
  }

  function setProducts(assignment: string, ids: string) {
    return withTenant(DEMO_ORG_ID, () =>
      getDb().execute(sql`update products set ${sql.raw(assignment)} where id in (${sql.raw(ids)})`),
    )
  }

  async function seedCoupon(
    code: string,
    promotion: Partial<typeof promotions.$inferInsert> = {},
    coupon: Partial<typeof coupons.$inferInsert> = {},
  ) {
    await withTenant(DEMO_ORG_ID, async () => {
      const promotionId = crypto.randomUUID()
      await getDb().insert(promotions).values({
        id: promotionId,
        discountType: 'percentage',
        discountValue: '10',
        target: 'order',
        startsAt: new Date(Date.now() - 86_400_000),
        ...promotion,
      })
      await getDb().insert(coupons).values({ code, promotionId, ...coupon })
    })
  }

  async function timesUsed(code: string) {
    return (await adapter.validateCoupon(code))?.timesUsed
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
      expect(await asTenant((admin) => admin.getStoreSettings())).toMatchObject({ currencyLocked: false })
      await asTenant((admin) => admin.updateStoreSettings({ currency: 'USD' }))
      await placedOrder()
      expect(await asTenant((admin) => admin.getStoreSettings())).toMatchObject({ currencyLocked: true })

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

  it('reports a cart that is gone as not found, not as a database failure', async () => {
    await expect(
      adapter.addToCart('no-such-cart', { productId: 'prod-1', quantity: 1 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Cart not found: no-such-cart' })
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
    await seedCoupon('SAVE10')
    const cart = await adapter.createCart()
    const withCoupon = await adapter.applyCoupon(cart.id, 'SAVE10')
    expect(withCoupon.couponCode).toBe('SAVE10')
    const noCoupon = await adapter.removeCoupon(cart.id)
    expect(noCoupon.couponCode).toBeNull()
    expect(noCoupon.totals.discount).toBeNull()
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

  describe('stock', () => {
    const inStock = { productId: 'prod-2' }

    function setStock(quantity: number) {
      return setProducts(`inventory_quantity = ${quantity}`, `'prod-2'`)
    }

    it('refuses more than a tracked stock holds, and sells all of it', async () => {
      await setStock(3)
      const cart = await adapter.createCart()
      await expect(adapter.addToCart(cart.id, { ...inStock, quantity: 4 })).rejects.toMatchObject({
        code: 'VALIDATION',
        message: expect.stringContaining('Only 3 of'),
      })
      const added = await adapter.addToCart(cart.id, { ...inStock, quantity: 3 })
      expect(added.itemCount).toBe(3)
    })

    it('counts what the cart already holds when adding', async () => {
      await setStock(3)
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { ...inStock, quantity: 2 })
      await expect(adapter.addToCart(cart.id, { ...inStock, quantity: 2 })).rejects.toMatchObject({ code: 'VALIDATION' })
      expect((await adapter.getCart(cart.id)).itemCount).toBe(2)
    })

    it('checks a new quantity for a line, and still lets it go down', async () => {
      await setStock(3)
      const cart = await adapter.createCart()
      const added = await adapter.addToCart(cart.id, { ...inStock, quantity: 3 })
      const line = added.items[0]!
      await expect(adapter.updateCartItem(cart.id, line.id, 4)).rejects.toMatchObject({ code: 'VALIDATION' })
      expect((await adapter.updateCartItem(cart.id, line.id, 1)).itemCount).toBe(1)
    })

    it('checks the tighter of product and variant stock', async () => {
      await setProducts(`inventory_quantity = 100`, `'prod-1'`)
      await withTenant(DEMO_ORG_ID, () =>
        getDb().execute(sql`update product_variants set inventory_quantity = 2 where id = 'var-tshirt-s'`),
      )
      const cart = await adapter.createCart()
      await expect(
        adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-s', quantity: 3 }),
      ).rejects.toMatchObject({ code: 'VALIDATION' })
    })

    it('does not place an order for more than is left', async () => {
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { ...inStock, quantity: 5 })
      await adapter.setShippingAddress(cart.id, fullAddress())
      await adapter.setShippingMethod(cart.id, 'standard')
      await setStock(4)
      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({ code: 'VALIDATION' })
      expect((await adapter.getCart(cart.id)).items).toHaveLength(1)
    })

    it('does not create an order for more than is left', async () => {
      await setStock(1)
      await expect(directOrder()).rejects.toMatchObject({ code: 'VALIDATION' })
    })

    it('leaves an untracked stock unlimited', async () => {
      await setProducts(`inventory_quantity = null`, `'prod-2'`)
      const cart = await adapter.createCart()
      expect((await adapter.addToCart(cart.id, { ...inStock, quantity: 500 })).itemCount).toBe(500)
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
    const cart = await readyCart()
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

    it('invents no payment method for an order placed without one', async () => {
      const order = await adapter.getOrder((await placedOrder()).id)
      expect(order.paymentMethod).toBeNull()
    })

    it('snapshots what was bought on the order', async () => {
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-1', variantId: 'var-tshirt-l', quantity: 2 })
      await adapter.setShippingAddress(cart.id, fullAddress())
      await adapter.setShippingMethod(cart.id, 'standard')
      const [item] = (await adapter.placeOrder(cart.id)).items
      expect(item).toMatchObject({ variantId: 'var-tshirt-l', productType: 'physical', quantity: 2 })
      expect(item?.name.en).toBe('Premium Cotton T-Shirt')
      expect(item?.variantName?.en).toBe('Large')
      expect(item?.image?.url).toContain('T-Shirt')
      expect(item?.totalPrice.amount).toBe(64)
    })

    it('keeps amounts exact to the cent', async () => {
      await setProducts('price = 19.99', `'prod-2'`)
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 3 })
      await adapter.setShippingAddress(cart.id, fullAddress())
      const ready = await adapter.setShippingMethod(cart.id, 'standard')
      expect(ready.totals.subtotal.amount).toBe(59.97)
      expect(ready.totals.total.amount).toBe(74.97)
      const order = await adapter.placeOrder(cart.id)
      expect(order.totals.total.amount).toBe(74.97)
    })
  })

  describe('shipping requirement', () => {
    it('refuses a physical order without a shipping method, and keeps the cart', async () => {
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      await adapter.setShippingAddress(cart.id, fullAddress())
      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({
        code: 'VALIDATION',
        message: expect.stringContaining('shipping method'),
      })
      expect((await adapter.getCart(cart.id)).items).toHaveLength(1)
    })

    it('refuses a physical order without an address', async () => {
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      await adapter.setShippingMethod(cart.id, 'standard')
      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({
        code: 'VALIDATION',
        message: expect.stringContaining('address'),
      })
    })

    it('needs no shipping when nothing ships', async () => {
      await setProducts(`requires_shipping = false, product_type = 'digital'`, `'prod-3'`)
      const cart = await adapter.createCart()
      const updated = await adapter.addToCart(cart.id, { productId: 'prod-3', quantity: 1 })
      expect(updated.requiresShipping).toBe(false)

      const order = await adapter.placeOrder(cart.id)
      expect(order.requiresShipping).toBe(false)
      expect(order.fulfillmentStatus).toBe('not_required')
      expect(order.shippingMethod).toBeNull()
      expect(order.items[0]?.productType).toBe('digital')
      expect(order.totals.total.amount).toBe(149)
    })

    it('defaults shipping from the product type', async () => {
      const name = { en: 'Ebook' }
      const created = await Promise.all([
        asTenant((admin) => admin.createProduct({ name, slug: 'ebook', productType: 'digital' })),
        asTenant((admin) => admin.createProduct({ name, slug: 'poster', productType: 'physical' })),
        asTenant((admin) => admin.createProduct({ name, slug: 'kit', productType: 'digital', requiresShipping: true })),
      ])
      expect(created.map(product => product.requiresShipping)).toEqual([false, true, true])

      const changed = await asTenant((admin) => admin.updateProduct(created[1].id, { productType: 'digital' }))
      expect(changed.requiresShipping).toBe(false)
    })

    it('needs shipping as soon as one item ships', async () => {
      await setProducts(`requires_shipping = false`, `'prod-3'`)
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-3', quantity: 1 })
      const mixed = await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      expect(mixed.requiresShipping).toBe(true)
      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({ code: 'VALIDATION' })
    })

    it('stops charging shipping when the last item that ships leaves the cart', async () => {
      await setProducts(`requires_shipping = false`, `'prod-3'`)
      const cart = await readyCart()
      const mixed = await adapter.addToCart(cart.id, { productId: 'prod-3', quantity: 1 })
      expect(mixed.totals.shipping?.amount).toBe(15)

      const line = mixed.items.find(item => item.productId === 'prod-2')!
      const remaining = await adapter.removeFromCart(cart.id, line.id)
      expect(remaining.shippingMethod).toBeNull()
      expect(remaining.totals.shipping).toBeNull()
      expect(remaining.totals.total.amount).toBe(149)
    })
  })

  describe('coupons', () => {
    it('gives the use back when the order is cancelled', async () => {
      await seedCoupon('ONCE', { usageLimitPerCustomer: 1, usageLimitTotal: 1 })
      const cart = await readyCart()
      await adapter.applyCoupon(cart.id, 'ONCE')
      const order = await adapter.placeOrder(cart.id, { contactEmail: 'ana@example.com' })
      expect(await timesUsed('ONCE')).toBe(1)

      await adapter.cancelOrder(order.id)
      expect(await timesUsed('ONCE')).toBe(0)

      const retry = await readyCart()
      await adapter.applyCoupon(retry.id, 'ONCE')
      await expect(adapter.placeOrder(retry.id, { contactEmail: 'ana@example.com' })).resolves.toBeTruthy()
    })

    it('takes no use from an order it gave nothing, and gives none back', async () => {
      await seedCoupon('NOSHIP', { discountType: 'free_shipping', discountValue: '0', usageLimitPerCustomer: 1 })
      await setProducts(`requires_shipping = false, product_type = 'digital'`, `'prod-3'`)
      const placeDigital = async () => {
        const cart = await adapter.createCart()
        await adapter.addToCart(cart.id, { productId: 'prod-3', quantity: 1 })
        await adapter.applyCoupon(cart.id, 'NOSHIP')
        return adapter.placeOrder(cart.id, { contactEmail: 'ana@example.com' })
      }

      const order = await placeDigital()
      expect(order.couponCode).toBeNull()
      expect(await timesUsed('NOSHIP')).toBe(0)

      // The per-customer limit of one has not been touched either.
      await expect(placeDigital()).resolves.toMatchObject({ couponCode: null })

      await adapter.cancelOrder(order.id)
      expect(await timesUsed('NOSHIP')).toBe(0)
    })

    it('gives the use back when the payment fails', async () => {
      await seedCoupon('DECLINED')
      const cart = await readyCart()
      await adapter.applyCoupon(cart.id, 'DECLINED')
      const order = await adapter.placeOrder(cart.id)
      await adapter.applyPaymentEvent(order.id, { outcome: 'failed', amount: null, currency: null, provider: 'test' })
      expect(await timesUsed('DECLINED')).toBe(0)
    })

    it('takes a percentage off the cart and the order, and the shopper pays the total', async () => {
      await seedCoupon('SAVE10')
      const cart = await readyCart()
      const applied = await adapter.applyCoupon(cart.id, 'SAVE10')

      expect(applied.couponCode).toBe('SAVE10')
      expect(applied.couponError).toBeNull()
      expect(applied.totals.discount?.amount).toBe(7.9)
      expect(applied.totals.total.amount).toBe(79 + 15 - 7.9)

      const order = await adapter.placeOrder(cart.id)
      expect(order.couponCode).toBe('SAVE10')
      expect(order.totals.discount?.amount).toBe(7.9)
      expect(order.totals.total).toEqual(applied.totals.total)
      expect(await capture(order)).toBe('applied')
      expect((await adapter.getOrder(order.id)).paymentStatus).toBe('paid')
      expect(await timesUsed('SAVE10')).toBe(1)
    })

    it('never gives a fraction of a cent, so the capture matches the order', async () => {
      await setProducts('price = 19.99', `'prod-2'`)
      await seedCoupon('PCT15', { discountValue: '15' })
      const cart = await readyCart()
      const applied = await adapter.applyCoupon(cart.id, 'PCT15')
      expect(applied.totals.discount?.amount).toBe(3)
      expect(applied.totals.total.amount).toBe(31.99)

      const order = await adapter.placeOrder(cart.id)
      expect(order.totals.total.amount).toBe(31.99)
      expect(await capture(order)).toBe('applied')
    })

    it('caps a percentage at its maximum discount', async () => {
      await seedCoupon('CAPPED', { discountValue: '50', maxDiscount: '20' })
      const cart = await readyCart()
      expect((await adapter.applyCoupon(cart.id, 'CAPPED')).totals.discount?.amount).toBe(20)
    })

    it('takes a fixed amount off, never more than the goods cost', async () => {
      await seedCoupon('MINUS5', { discountType: 'fixed_amount', discountValue: '5' })
      await seedCoupon('MINUS500', { discountType: 'fixed_amount', discountValue: '500' })
      const cart = await readyCart()
      expect((await adapter.applyCoupon(cart.id, 'MINUS5')).totals.total.amount).toBe(89)

      const free = await adapter.applyCoupon(cart.id, 'MINUS500')
      expect(free.totals.discount?.amount).toBe(79)
      expect(free.totals.total.amount).toBe(15)
    })

    it('waives shipping with a free shipping coupon', async () => {
      await seedCoupon('SHIPFREE', { discountType: 'free_shipping', target: 'shipping' })
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      const noMethod = await adapter.applyCoupon(cart.id, 'SHIPFREE')
      expect(noMethod.totals.discount).toBeNull()

      await adapter.setShippingAddress(cart.id, fullAddress())
      const updated = await adapter.setShippingMethod(cart.id, 'express')
      expect(updated.totals.shipping?.amount).toBe(35)
      expect(updated.totals.discount?.amount).toBe(35)
      expect(updated.totals.total.amount).toBe(79)
      expect((await adapter.placeOrder(cart.id)).totals.total.amount).toBe(79)
    })

    it('discounts only the products or categories it targets', async () => {
      await seedCoupon('EARBUDS', {
        discountValue: '50',
        target: 'product',
        conditionsJson: JSON.stringify({ productIds: ['prod-2'] }),
      })
      await seedCoupon('BAGS', {
        discountValue: '50',
        target: 'category',
        conditionsJson: JSON.stringify({ categoryIds: ['cat-accessories'] }),
      })
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-2', quantity: 1 })
      await adapter.addToCart(cart.id, { productId: 'prod-3', quantity: 1 })

      expect((await adapter.applyCoupon(cart.id, 'EARBUDS')).totals.discount?.amount).toBe(39.5)
      expect((await adapter.applyCoupon(cart.id, 'BAGS')).totals.discount?.amount).toBe(74.5)
    })

    it('discounts shipping when shipping is the target', async () => {
      await seedCoupon('HALFSHIP', { discountValue: '50', target: 'shipping' })
      const cart = await readyCart()
      expect((await adapter.applyCoupon(cart.id, 'HALFSHIP')).totals.discount?.amount).toBe(7.5)
    })

    it('makes a fully discounted order free, with nothing left to pay', async () => {
      await setProducts('requires_shipping = false', `'prod-3'`)
      await seedCoupon('ALLFREE', { discountValue: '100' })
      const cart = await adapter.createCart()
      await adapter.addToCart(cart.id, { productId: 'prod-3', quantity: 1 })
      const applied = await adapter.applyCoupon(cart.id, 'ALLFREE')
      expect(applied.totals.total.amount).toBe(0)

      const order = await adapter.placeOrder(cart.id)
      expect(order.paymentStatus).toBe('free')
      expect(order.status).toBe('approved')
      expect(typeof order.approvedAt).toBe('string')
    })

    const DAY = 86_400_000
    const invalid: [string, Parameters<typeof seedCoupon>[1], Parameters<typeof seedCoupon>[2], RegExp][] = [
      ['not started', { startsAt: new Date(Date.now() + DAY) }, {}, /not active yet/],
      ['expired', { endsAt: new Date(Date.now() - 1000) }, {}, /expired/],
      ['inactive', { isActive: false }, {}, /no longer valid/],
      ['disabled', {}, { isValid: false }, /no longer valid/],
      ['used up', { usageLimitTotal: 2 }, { timesUsed: 2 }, /fully redeemed/],
      ['below the minimum', { conditionsJson: JSON.stringify({ minPurchaseAmount: { amount: 80, currency: 'EUR', formatted: '' } }) }, {}, /larger order/],
      ['below the item count', { conditionsJson: JSON.stringify({ minItemCount: 2 }) }, {}, /larger order/],
      ['for other items', { target: 'product', conditionsJson: JSON.stringify({ productIds: ['prod-3'] }) }, {}, /does not apply/],
      ['buy x get y', { discountType: 'buy_x_get_y' }, {}, /cannot be used/],
      ['a bundle', { discountType: 'bundle' }, {}, /cannot be used/],
      ['for a customer segment', { target: 'customer' }, {}, /cannot be used/],
      ['in another currency', { discountType: 'fixed_amount', currency: 'USD' }, {}, /cannot be used/],
    ]

    it.each(invalid)('refuses a coupon that is %s', async (_name, promotion, coupon, message) => {
      await seedCoupon('KEPT')
      await seedCoupon('BAD', promotion, coupon)
      const cart = await readyCart()
      await adapter.applyCoupon(cart.id, 'KEPT')

      await expect(adapter.applyCoupon(cart.id, 'BAD')).rejects.toMatchObject({ code: 'VALIDATION', message: expect.stringMatching(message) })
      expect((await adapter.getCart(cart.id)).couponCode).toBe('KEPT')
      expect((await adapter.validateCoupon('BAD'))?.isValid).toBe(promotion?.conditionsJson != null)
    })

    it('refuses a code that does not exist', async () => {
      const cart = await readyCart()
      await expect(adapter.applyCoupon(cart.id, 'FAKE')).rejects.toMatchObject({ code: 'VALIDATION' })
      expect((await adapter.getCart(cart.id)).couponCode).toBeNull()
    })

    it('reports why a coupon that stopped applying gives nothing, and refuses the order', async () => {
      await seedCoupon('OVER100', {
        conditionsJson: JSON.stringify({ minPurchaseAmount: { amount: 100, currency: 'EUR', formatted: '' } }),
      })
      const cart = await readyCart()
      await adapter.updateCartItem(cart.id, cart.items[0]!.id, 2)
      await adapter.applyCoupon(cart.id, 'OVER100')

      const shrunk = await adapter.updateCartItem(cart.id, cart.items[0]!.id, 1)
      expect(shrunk.couponCode).toBe('OVER100')
      expect(shrunk.couponError).toMatch(/larger order/)
      expect(shrunk.totals.discount).toBeNull()
      expect(shrunk.totals.total.amount).toBe(94)

      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({ code: 'VALIDATION' })
      expect(await timesUsed('OVER100')).toBe(0)
      expect((await adapter.getCart(cart.id)).items).toHaveLength(1)

      await adapter.removeCoupon(cart.id)
      expect((await adapter.placeOrder(cart.id)).totals.total.amount).toBe(94)
    })

    it('refuses an order when the coupon ran out after it was applied', async () => {
      await seedCoupon('LAST', { usageLimitTotal: 1 })
      const first = await readyCart()
      const second = await readyCart()
      await adapter.applyCoupon(first.id, 'LAST')
      await adapter.applyCoupon(second.id, 'LAST')

      await adapter.placeOrder(first.id)
      await expect(adapter.placeOrder(second.id)).rejects.toMatchObject({ code: 'VALIDATION' })
      expect(await timesUsed('LAST')).toBe(1)
    })

    it('lets concurrent orders redeem a limited coupon only as often as the limit', async () => {
      await seedCoupon('RACE', { usageLimitTotal: 2 })
      const carts = await Promise.all([readyCart(), readyCart(), readyCart(), readyCart()])
      for (const cart of carts) await adapter.applyCoupon(cart.id, 'RACE')

      const results = await Promise.allSettled(carts.map(cart => adapter.placeOrder(cart.id)))
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(2)
      expect(await timesUsed('RACE')).toBe(2)
    })

    it('limits uses per customer, including guests who share an email', async () => {
      await seedCoupon('PERCUSTOMER', { usageLimitPerCustomer: 1 })
      const customerId = await seedCustomer('Once', 'Only')
      const redeem = async (options: { customerId?: string; contactEmail?: string }) => {
        const cart = await readyCart()
        await adapter.applyCoupon(cart.id, 'PERCUSTOMER')
        return adapter.placeOrder(cart.id, options)
      }

      await redeem({ customerId })
      await expect(redeem({ customerId })).rejects.toMatchObject({ code: 'VALIDATION' })

      await redeem({ customerId: await seedCustomer('Guest', 'One'), contactEmail: 'guest@example.com' })
      await expect(
        redeem({ customerId: await seedCustomer('Guest', 'Two'), contactEmail: 'GUEST@example.com' }),
      ).rejects.toMatchObject({ code: 'VALIDATION' })

      await redeem({ customerId: await seedCustomer('Other', 'Person') })
      expect(await timesUsed('PERCUSTOMER')).toBe(3)
    })

    it('needs to know the shopper to honour a per-customer limit', async () => {
      await seedCoupon('WHOAREYOU', { usageLimitPerCustomer: 1 })
      const cart = await readyCart()
      await adapter.applyCoupon(cart.id, 'WHOAREYOU')
      await expect(adapter.placeOrder(cart.id)).rejects.toMatchObject({ code: 'VALIDATION' })
    })

    it('keeps a first-order coupon to first orders', async () => {
      await seedCoupon('WELCOME', { conditionsJson: JSON.stringify({ firstOrderOnly: true }) })
      const customerId = await seedCustomer('First', 'Timer')
      const redeem = async () => {
        const cart = await readyCart()
        await adapter.applyCoupon(cart.id, 'WELCOME')
        return adapter.placeOrder(cart.id, { customerId })
      }
      await redeem()
      await expect(redeem()).rejects.toMatchObject({ code: 'VALIDATION' })
    })

    it('reports validity and typed values from validateCoupon', async () => {
      await seedCoupon('GOOD', { maxDiscount: '20' })
      await seedCoupon('OLD', { endsAt: new Date(Date.now() - 1000) })

      const good = await adapter.validateCoupon('GOOD')
      expect(good).toMatchObject({ isValid: true, invalidReason: null, timesUsed: 0 })
      expect(good?.promotion.discountValue).toBe(10)
      expect(good?.promotion.maxDiscount?.amount).toBe(20)
      expect(good?.promotion.maxDiscount?.currency).toBe('EUR')
      expect(typeof good?.promotion.startsAt).toBe('string')

      expect(await adapter.validateCoupon('OLD')).toMatchObject({ isValid: false, invalidReason: 'expired' })
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
      await asTenant((admin) => admin.recordRefund(refunded.id))
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

    it('keeps where the money went, so the order can be refunded', async () => {
      const order = await placedOrder()
      const { amount, currency } = order.totals.total
      await adapter.applyPaymentEvent(order.id, { outcome: 'captured', amount, currency, provider, transactionId: 'tx_1' })
      expect(await adapter.getOrder(order.id)).toMatchObject({
        paymentProvider: provider,
        paymentTransactionId: 'tx_1',
      })
    })

    it('keeps where a late payment went, too', async () => {
      const order = await placedOrder()
      const { amount, currency } = order.totals.total
      await adapter.cancelOrder(order.id)
      await adapter.applyPaymentEvent(order.id, { outcome: 'captured', amount, currency, provider, transactionId: 'tx_2' })
      expect(await adapter.getOrder(order.id)).toMatchObject({
        status: 'cancelled',
        paymentStatus: 'paid',
        paymentProvider: provider,
        paymentTransactionId: 'tx_2',
      })
    })

    it('does not lose the started payment when a callback has no id', async () => {
      const order = await placedOrder()
      const { amount, currency } = order.totals.total
      await adapter.recordOrderPayment(order.id, {
        provider,
        transactionId: 'tx_3',
        details: { method: 'multibanco', entity: '11111', reference: '123456789', expiresAt: null },
      })
      await adapter.applyPaymentEvent(order.id, { outcome: 'captured', amount, currency, provider, transactionId: null })
      expect((await adapter.getOrder(order.id)).paymentTransactionId).toBe('tx_3')
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

  describe('started payments', () => {
    const payment = {
      provider: 'easypay',
      transactionId: 'tx_1',
      details: { method: 'multibanco', entity: '11111', reference: '123456789', expiresAt: '2026-11-03T23:59' },
    } as const

    it('records what the shopper needs to finish paying', async () => {
      const order = await placedOrder()
      expect(await adapter.recordOrderPayment(order.id, payment)).toBe(true)
      expect(await adapter.getOrder(order.id)).toMatchObject({
        paymentStatus: 'unpaid',
        paymentProvider: 'easypay',
        paymentTransactionId: 'tx_1',
        paymentDetails: payment.details,
      })
    })

    it('replaces an earlier attempt', async () => {
      const order = await placedOrder()
      await adapter.recordOrderPayment(order.id, payment)
      await adapter.recordOrderPayment(order.id, { ...payment, transactionId: 'tx_2' })
      expect((await adapter.getOrder(order.id)).paymentTransactionId).toBe('tx_2')
    })

    it('refuses an order that is no longer waiting for payment', async () => {
      const paid = await placedOrder()
      await capture(paid)
      expect(await adapter.recordOrderPayment(paid.id, payment)).toBe(false)

      const cancelled = await placedOrder()
      await adapter.cancelOrder(cancelled.id)
      expect(await adapter.recordOrderPayment(cancelled.id, payment)).toBe(false)
      expect((await adapter.getOrder(cancelled.id)).paymentProvider).toBeNull()
    })
  })

  describe('recording refunds', () => {
    it('cancels a paid order and marks it refunded', async () => {
      const order = await placedOrder()
      await capture(order)
      await asTenant((admin) => admin.recordRefund(order.id, 'Refunded by Stripe'))

      const after = await adapter.getOrder(order.id)
      expect(after).toMatchObject({ status: 'cancelled', paymentStatus: 'refunded' })
      expect(after.cancelledAt).toBeTruthy()
      const history = await adapter.getOrderHistory(order.id)
      expect(history.some((entry) => entry.note === 'Refunded by Stripe')).toBe(true)
    })

    it('refuses an order nobody paid', async () => {
      const order = await placedOrder()
      await expect(asTenant((admin) => admin.recordRefund(order.id))).rejects.toThrow('Only paid orders')
      expect((await adapter.getOrder(order.id)).paymentStatus).toBe('unpaid')
    })

    it('cannot refund twice', async () => {
      const order = await placedOrder()
      await capture(order)
      await asTenant((admin) => admin.recordRefund(order.id))
      await expect(asTenant((admin) => admin.recordRefund(order.id))).rejects.toThrow('Only paid orders')
    })

    it('refunds a late payment on a cancelled order', async () => {
      const order = await placedOrder()
      await adapter.cancelOrder(order.id)
      await capture(order)
      await asTenant((admin) => admin.recordRefund(order.id))
      expect((await adapter.getOrder(order.id)).paymentStatus).toBe('refunded')
    })

    it('releases the coupon', async () => {
      await seedCoupon('REFUNDED')
      const cart = await readyCart()
      await adapter.applyCoupon(cart.id, 'REFUNDED')
      const order = await adapter.placeOrder(cart.id)
      await capture(order)
      expect(await timesUsed('REFUNDED')).toBe(1)

      await asTenant((admin) => admin.recordRefund(order.id))
      expect(await timesUsed('REFUNDED')).toBe(0)
    })

    it('does not release the coupon again after a cancelled order is refunded', async () => {
      await seedCoupon('LATE', {}, { timesUsed: 5 })
      const cart = await readyCart()
      await adapter.applyCoupon(cart.id, 'LATE')
      const order = await adapter.placeOrder(cart.id)
      await adapter.cancelOrder(order.id)
      await capture(order)
      expect(await timesUsed('LATE')).toBe(5)

      await asTenant((admin) => admin.recordRefund(order.id))
      expect(await timesUsed('LATE')).toBe(5)
    })
  })

  it('should reject placing order with empty cart', async () => {
    const cart = await adapter.createCart()
    await expect(adapter.placeOrder(cart.id)).rejects.toThrow()
  })

  // ---- Orders ----

  it('should create an order directly', async () => {
    const order = await directOrder()
    expect(order.id).toBeTruthy()
    expect(order.status).toBe('placed')
  })

  it('should get an order by id', async () => {
    const created = await directOrder()
    const order = await adapter.getOrder(created.id)
    expect(order.id).toBe(created.id)
  })

  it('should list order statuses', async () => {
    const statuses = await adapter.getOrderStatuses()
    expect(statuses.length).toBeGreaterThan(0)
    expect(statuses.find((s: any) => s.id === 'placed')).toBeTruthy()
  })

  it('should update order status', async () => {
    const order = await directOrder()
    await adapter.updateOrderStatus(order.id, { status: 'approved' })
    const updated = await adapter.getOrder(order.id)
    expect(updated.status).toBe('approved')
  })

  it('should track order history', async () => {
    const order = await directOrder()
    await adapter.updateOrderStatus(order.id, { status: 'approved' })
    const history = await adapter.getOrderHistory(order.id)
    expect(history.length).toBeGreaterThanOrEqual(2)
  })

  it('should cancel an order', async () => {
    const order = await directOrder()
    await adapter.cancelOrder(order.id, 'Changed my mind')
    const cancelled = await adapter.getOrder(order.id)
    expect(cancelled.status).toBe('cancelled')
  })

  describe('status races', () => {
    it('gives a coupon use back once when two cancels race', async () => {
      await seedCoupon('RACED')
      const place = async () => {
        const cart = await readyCart()
        await adapter.applyCoupon(cart.id, 'RACED')
        return adapter.placeOrder(cart.id)
      }
      const order = await place()
      await place()
      expect(await timesUsed('RACED')).toBe(2)

      await Promise.all([adapter.cancelOrder(order.id), adapter.cancelOrder(order.id)])

      expect((await adapter.getOrder(order.id)).status).toBe('cancelled')
      expect(await timesUsed('RACED')).toBe(1)
      const history = await adapter.getOrderHistory(order.id)
      expect(history.filter(entry => entry.action === 'cancelled')).toHaveLength(1)
    })

    it('refuses a cancel that lost to a capture, and leaves the capture alone', async () => {
      const order = await directOrder()
      let commitCapture = () => {}
      const held = new Promise<void>(resolve => { commitCapture = resolve })
      let captureWritten = () => {}
      const written = new Promise<void>(resolve => { captureWritten = resolve })

      // Hold the capture's row lock so the cancel reads 'placed', then waits on the update.
      const capturing = withTenant(DEMO_ORG_ID, async () => {
        await getDb().execute(sql`
          update orders set status = 'approved', payment_status = 'paid' where id = ${order.id}
        `)
        captureWritten()
        await held
      })
      await written
      const cancelling = adapter.cancelOrder(order.id)
      const refused = expect(cancelling).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('It is now approved with payment paid'),
      })
      await new Promise(resolve => setTimeout(resolve, 2_000))
      commitCapture()
      await capturing
      await refused

      expect(await adapter.getOrder(order.id)).toMatchObject({ status: 'approved', paymentStatus: 'paid' })
    })
  })

  it('should duplicate an order', async () => {
    const order = await directOrder()
    const dup = await adapter.duplicateOrder(order.id)
    expect(dup.id).not.toBe(order.id)
    expect(dup.items.length).toBe(order.items.length)
  })

  describe('recorded orders', () => {
    it('records real items, shipping, payment, billing and contact on a direct order', async () => {
      const billing = fullAddress({ city: 'Porto' })
      const order = await directOrder({
        items: [{
          productId: 'prod-1',
          variantId: 'var-tshirt-l',
          quantity: 2,
          unitPrice: { amount: 32, currency: 'EUR', formatted: '32 EUR' },
        }],
        billingAddress: billing,
        shippingMethodId: 'express',
        payment: { methodId: 'card', transactionId: 'pi_123' },
        receiver: { firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com' },
        note: 'Ring twice',
      })
      const [express] = (await adapter.getShippingMethods('any')).slice(1)
      const [item] = order.items

      expect(item?.name.en).toBe('Premium Cotton T-Shirt')
      expect(item?.variantId).toBe('var-tshirt-l')
      expect(item?.variantName?.en).toBe('Large')
      expect(item?.image?.url).toContain('T-Shirt')
      expect(item?.productType).toBe('physical')
      expect(order.shippingMethod).toEqual(express)
      expect(order.totals.subtotal.amount).toBe(64)
      expect(order.totals.shipping?.amount).toBe(35)
      expect(order.totals.total.amount).toBe(99)
      expect(order.paymentMethod?.id).toBe('card')
      expect(order.paymentTransactionId).toBe('pi_123')
      expect(order.billingAddress).toEqual(billing)
      expect(order.contactEmail).toBe('ana@example.com')
      expect(order.note).toBe('Ring twice')
    })

    it('bills the shipping address when no billing address is given', async () => {
      const order = await directOrder()
      expect(order.billingAddress).toEqual(order.shippingAddress)
    })

    it('redeems a coupon on a direct order', async () => {
      await seedCoupon('DIRECT10')
      const order = await directOrder({ couponCode: 'DIRECT10' })
      expect(order.couponCode).toBe('DIRECT10')
      expect(order.totals.discount?.amount).toBe(20)
      expect(order.totals.total.amount).toBe(200 + 15 - 20)
      expect(await timesUsed('DIRECT10')).toBe(1)
    })

    it('refuses what it cannot record truthfully', async () => {
      await expect(directOrder({ shippingMethodId: 'teleport' })).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(directOrder({ shippingMethodId: null })).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(directOrder({ shippingAddress: null })).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(directOrder({ payment: { methodId: 'iou' } })).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(directOrder({ couponCode: 'NOPE' })).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(directOrder({
        items: [{ productId: 'prod-2', quantity: 1, unitPrice: { amount: 100, currency: 'USD', formatted: '100 USD' } }],
      })).rejects.toMatchObject({ code: 'VALIDATION' })
      await expect(directOrder({
        items: [{ productId: 'none', quantity: 1, unitPrice: { amount: 100, currency: 'EUR', formatted: '100 EUR' } }],
      })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('duplicates goods, delivery and payment, and charges the same', async () => {
      const original = await directOrder({
        items: [{
          productId: 'prod-1',
          variantId: 'var-tshirt-m',
          quantity: 1,
          unitPrice: { amount: 29, currency: 'EUR', formatted: '29 EUR' },
        }],
        billingAddress: fullAddress({ city: 'Porto' }),
        shippingMethodId: 'express',
        payment: { methodId: 'cod', transactionId: 'first-charge' },
        receiver: { firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com' },
      })
      const dup = await adapter.duplicateOrder(original.id)

      expect(dup.items[0]).toMatchObject({ variantId: 'var-tshirt-m', name: original.items[0]?.name })
      expect(dup.items[0]?.variantName).toEqual(original.items[0]?.variantName)
      expect(dup.shippingMethod).toEqual(original.shippingMethod)
      expect(dup.paymentMethod).toEqual(original.paymentMethod)
      expect(dup.billingAddress).toEqual(original.billingAddress)
      expect(dup.contactEmail).toBe('ana@example.com')
      expect(dup.totals).toEqual(original.totals)
      expect(dup.paymentTransactionId).toBeNull()
    })

    it('does not redeem a coupon again when duplicating', async () => {
      await seedCoupon('ONCE', { usageLimitTotal: 1 })
      const original = await directOrder({ couponCode: 'ONCE' })
      const dup = await adapter.duplicateOrder(original.id)
      expect(dup.couponCode).toBeNull()
      expect(dup.totals.total.amount).toBe(original.totals.subtotal.amount + 15)
      expect(await timesUsed('ONCE')).toBe(1)
    })
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
