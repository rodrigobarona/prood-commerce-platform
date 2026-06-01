// ---------------------------------------------------------------------------
// Seed — populate the database with demo data (Drizzle + Neon)
// ---------------------------------------------------------------------------

import { getDb, withTenant } from './client.js'
import type { DrizzleDatabase } from './client.js'
import * as schema from './schema/index.js'

/**
 * Demo tenant id. Seed data is tagged with this organization so it is visible
 * when `app.current_org_id` is set to DEMO_ORG_ID (e.g. a dashboard org with
 * this id, or a storefront domain mapped to it).
 */
export const DEMO_ORG_ID = 'org_demo'

/**
 * Seed the database with demo products, categories, and store info via Drizzle.
 *
 * Runs inside `withTenant(DEMO_ORG_ID)` so every insert is auto-tagged with the
 * tenant `organization_id` (via the column default) and satisfies the RLS
 * write check. The optional `db` argument is accepted for backward
 * compatibility but inserts always use the tenant-scoped connection.
 */
export async function seedDrizzle(_db?: DrizzleDatabase): Promise<void> {
  await withTenant(DEMO_ORG_ID, async () => {
    await seedTenantData()
  })
}

async function seedTenantData(): Promise<void> {
  const database = getDb()

  // ---- Store ----
  await database.insert(schema.storeInfo).values({
    id: 'default',
    name: {
      en: 'Prood Demo Store',
      pt: 'Loja Demo Prood',
      es: 'Tienda Demo Prood',
    },
    description: {
      en: 'A demo store powered by @prood/platform',
      pt: 'Uma loja demo powered by @prood/platform',
      es: 'Una tienda demo powered by @prood/platform',
    },
    currency: 'SAR',
    locale: 'en',
    timezone: 'Asia/Riyadh',
    supportedCurrencies: ['SAR', 'AED', 'USD'],
    supportedLocales: ['en', 'pt', 'es'],
  })

  // ---- Categories ----
  const categories = [
    {
      id: 'cat-clothing',
      name: { en: 'Clothing', pt: 'Roupas', es: 'Ropa' },
      slug: 'clothing',
      sortOrder: 1,
    },
    {
      id: 'cat-electronics',
      name: { en: 'Electronics', pt: 'Eletrônicos', es: 'Electrónica' },
      slug: 'electronics',
      sortOrder: 2,
    },
    {
      id: 'cat-accessories',
      name: { en: 'Accessories', pt: 'Acessórios', es: 'Accesorios' },
      slug: 'accessories',
      sortOrder: 3,
    },
  ]

  for (const cat of categories) {
    await database.insert(schema.categories).values(cat)
  }

  // ---- Products ----
  const products = [
    {
      id: 'prod-1',
      name: {
        en: 'Premium Cotton T-Shirt',
        pt: 'Camiseta de Algodão Premium',
        es: 'Camiseta de Algodón Premium',
      },
      slug: 'premium-cotton-t-shirt',
      description: {
        en: 'Ultra-soft 100% organic cotton t-shirt with a modern fit.',
        pt: 'Camiseta 100% algodão orgânico ultra macia com corte moderno.',
        es: 'Camiseta 100% algodón orgánico ultrasuave con corte moderno.',
      },
      price: '89.00',
      compareAtPrice: '120.00',
      currency: 'SAR',
      status: 'active',
      productType: 'physical',
      inStock: true,
      inventoryQuantity: 150,
      requiresShipping: true,
      vatIncluded: true,
      vatRate: 15,
      categoryId: 'cat-clothing',
    },
    {
      id: 'prod-2',
      name: {
        en: 'Wireless Bluetooth Earbuds',
        pt: 'Fones Bluetooth Sem Fio',
        es: 'Auriculares Bluetooth Inalámbricos',
      },
      slug: 'wireless-bluetooth-earbuds',
      description: {
        en: 'High-fidelity audio with active noise cancellation and 30h battery.',
        pt: 'Áudio de alta fidelidade com cancelamento de ruído ativo e 30h de bateria.',
        es: 'Audio de alta fidelidad con cancelación de ruido activa y 30h de batería.',
      },
      price: '249.00',
      currency: 'SAR',
      status: 'active',
      productType: 'physical',
      inStock: true,
      inventoryQuantity: 75,
      requiresShipping: true,
      vatIncluded: true,
      vatRate: 15,
      categoryId: 'cat-electronics',
    },
    {
      id: 'prod-3',
      name: {
        en: 'Leather Crossbody Bag',
        pt: 'Bolsa Transversal de Couro',
        es: 'Bolso Bandolera de Cuero',
      },
      slug: 'leather-crossbody-bag',
      description: {
        en: 'Handcrafted genuine leather bag with adjustable strap.',
        pt: 'Bolsa artesanal de couro genuíno com alça ajustável.',
        es: 'Bolso artesanal de cuero genuino con correa ajustable.',
      },
      price: '350.00',
      compareAtPrice: '450.00',
      currency: 'SAR',
      status: 'active',
      productType: 'physical',
      inStock: true,
      inventoryQuantity: 30,
      requiresShipping: true,
      vatIncluded: true,
      vatRate: 15,
      categoryId: 'cat-accessories',
    },
  ]

  for (const product of products) {
    const { categoryId, ...productData } = product
    await database.insert(schema.products).values(productData)

    await database.insert(schema.productCategories).values({
      productId: product.id,
      categoryId,
    })
  }

  // ---- Product Images ----
  const images = [
    { productId: 'prod-1', url: 'https://placehold.co/600x600/f0f0f0/333?text=T-Shirt', altText: 'Cotton T-Shirt', isPrimary: true, sortOrder: 1 },
    { productId: 'prod-2', url: 'https://placehold.co/600x600/1a1a2e/e0e0e0?text=Earbuds', altText: 'Wireless Earbuds', isPrimary: true, sortOrder: 1 },
    { productId: 'prod-3', url: 'https://placehold.co/600x600/8b4513/fff?text=Bag', altText: 'Leather Bag', isPrimary: true, sortOrder: 1 },
  ]

  for (const image of images) {
    await database.insert(schema.productImages).values(image)
  }

  // ---- Product Variants (for t-shirt) ----
  const variants = [
    {
      productId: 'prod-1',
      name: { en: 'Small', pt: 'Pequeno', es: 'Pequeño' },
      sku: 'TSHIRT-S',
      price: '89.00',
      inStock: true,
      inventoryQuantity: 50,
      sortOrder: 1,
    },
    {
      productId: 'prod-1',
      name: { en: 'Medium', pt: 'Médio', es: 'Mediano' },
      sku: 'TSHIRT-M',
      price: '89.00',
      inStock: true,
      inventoryQuantity: 60,
      sortOrder: 2,
    },
    {
      productId: 'prod-1',
      name: { en: 'Large', pt: 'Grande', es: 'Grande' },
      sku: 'TSHIRT-L',
      price: '99.00',
      inStock: true,
      inventoryQuantity: 40,
      sortOrder: 3,
    },
  ]

  for (const v of variants) {
    await database.insert(schema.productVariants).values(v)
  }

  // ---- Brands ----
  const brands = [
    {
      id: 'brand-1',
      name: { en: 'Prood Essentials', pt: 'Essenciais Prood', es: 'Esenciales Prood' },
      slug: 'prood-essentials',
      isActive: true,
    },
    {
      id: 'brand-2',
      name: { en: 'TechWave', pt: 'TechWave', es: 'TechWave' },
      slug: 'techwave',
      isActive: true,
    },
    {
      id: 'brand-3',
      name: { en: 'Artisan Leather', pt: 'Couro Artesanal', es: 'Cuero Artesanal' },
      slug: 'artisan-leather',
      isActive: true,
    },
  ]

  for (const brand of brands) {
    await database.insert(schema.brands).values(brand)
  }

  // ---- Countries ----
  const countryList = [
    {
      id: 'sa',
      code: 'SA',
      name: { en: 'Saudi Arabia', pt: 'Arábia Saudita', es: 'Arabia Saudita' },
      callingCode: '+966',
      currency: 'SAR',
    },
    {
      id: 'ae',
      code: 'AE',
      name: { en: 'United Arab Emirates', pt: 'Emirados Árabes Unidos', es: 'Emiratos Árabes Unidos' },
      callingCode: '+971',
      currency: 'AED',
    },
    {
      id: 'kw',
      code: 'KW',
      name: { en: 'Kuwait', pt: 'Kuwait', es: 'Kuwait' },
      callingCode: '+965',
      currency: 'KWD',
    },
    {
      id: 'bh',
      code: 'BH',
      name: { en: 'Bahrain', pt: 'Bahrein', es: 'Baréin' },
      callingCode: '+973',
      currency: 'BHD',
    },
    {
      id: 'om',
      code: 'OM',
      name: { en: 'Oman', pt: 'Omã', es: 'Omán' },
      callingCode: '+968',
      currency: 'OMR',
    },
    {
      id: 'qa',
      code: 'QA',
      name: { en: 'Qatar', pt: 'Catar', es: 'Catar' },
      callingCode: '+974',
      currency: 'QAR',
    },
  ]

  for (const country of countryList) {
    await database.insert(schema.countries).values(country)
  }

  // ---- Reviews ----
  const reviewsList = [
    { id: 'rev-1', productId: 'prod-1', authorName: 'Ahmed', rating: 5, title: 'Excellent quality', body: 'Best t-shirt I have ever bought. The cotton is incredibly soft.', verified: true, status: 'published' },
    { id: 'rev-2', productId: 'prod-1', authorName: 'Sara', rating: 4, title: 'Good fit', body: 'Nice shirt, true to size. Would buy again.', verified: true, status: 'published' },
    { id: 'rev-3', productId: 'prod-1', authorName: 'Omar', rating: 5, title: 'Love it', body: 'Perfect for everyday wear.', verified: false, status: 'published' },
    { id: 'rev-4', productId: 'prod-2', authorName: 'Fatima', rating: 5, title: 'Amazing sound', body: 'Crystal clear audio and the noise cancellation is top-notch.', verified: true, status: 'published' },
    { id: 'rev-5', productId: 'prod-2', authorName: 'Khalid', rating: 3, title: 'Decent', body: 'Good sound but battery life could be better.', verified: true, status: 'published' },
    { id: 'rev-6', productId: 'prod-3', authorName: 'Noura', rating: 4, title: 'Beautiful bag', body: 'Gorgeous leather, arrived well-packaged.', verified: true, status: 'published' },
  ]

  for (const review of reviewsList) {
    await database.insert(schema.reviews).values(review)
  }
}
