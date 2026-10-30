// ---------------------------------------------------------------------------
// Seed — populate the database with the demo store (Drizzle + Neon)
// ---------------------------------------------------------------------------

import { sql } from 'drizzle-orm'
import { getDb, withTenant } from './client.js'
import * as schema from './schema/index.js'

/**
 * Demo tenant id. The demo storefront resolves to it through the organization
 * slug `prood-demo` (e.g. `prood-demo.localhost`).
 */
export const DEMO_ORG_ID = 'org_demo'

/** Shared reference data — European, EUR-first. */
const countries = [
  { id: 'pt', code: 'PT', name: { en: 'Portugal', pt: 'Portugal', es: 'Portugal' }, callingCode: '+351', currency: 'EUR' },
  { id: 'es', code: 'ES', name: { en: 'Spain', pt: 'Espanha', es: 'España' }, callingCode: '+34', currency: 'EUR' },
  { id: 'fr', code: 'FR', name: { en: 'France', pt: 'França', es: 'Francia' }, callingCode: '+33', currency: 'EUR' },
  { id: 'de', code: 'DE', name: { en: 'Germany', pt: 'Alemanha', es: 'Alemania' }, callingCode: '+49', currency: 'EUR' },
  { id: 'it', code: 'IT', name: { en: 'Italy', pt: 'Itália', es: 'Italia' }, callingCode: '+39', currency: 'EUR' },
  { id: 'nl', code: 'NL', name: { en: 'Netherlands', pt: 'Países Baixos', es: 'Países Bajos' }, callingCode: '+31', currency: 'EUR' },
]

/**
 * Seed the demo store: the `org_demo` organization, shared reference data
 * (countries), and the demo catalog. Idempotent — rows that already exist are
 * left untouched, so it is safe to run against a seeded database.
 *
 * Tenant rows are inserted inside `withTenant(DEMO_ORG_ID)`, so they are
 * tagged by the `organization_id` column default and pass the RLS write check.
 */
export async function seedDrizzle(): Promise<void> {
  const db = getDb()

  await db.execute(sql`
    INSERT INTO "organization" ("id", "name", "slug")
    VALUES (${DEMO_ORG_ID}, 'Prood Demo Store', 'prood-demo')
    ON CONFLICT ("id") DO NOTHING
  `)
  await db.insert(schema.countries).values(countries).onConflictDoNothing()

  await withTenant(DEMO_ORG_ID, seedTenantData)
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
    currency: 'EUR',
    locale: 'en',
    timezone: 'Europe/Lisbon',
    supportedCurrencies: ['EUR'],
    supportedLocales: ['en', 'pt', 'es'],
  }).onConflictDoNothing()

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
    await database.insert(schema.categories).values(cat).onConflictDoNothing()
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
      price: '29.00',
      compareAtPrice: '39.00',
      currency: 'EUR',
      status: 'active',
      productType: 'physical',
      inStock: true,
      inventoryQuantity: 150,
      requiresShipping: true,
      vatIncluded: true,
      vatRate: 23,
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
      price: '79.00',
      currency: 'EUR',
      status: 'active',
      productType: 'physical',
      inStock: true,
      inventoryQuantity: 75,
      requiresShipping: true,
      vatIncluded: true,
      vatRate: 23,
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
      price: '149.00',
      compareAtPrice: '189.00',
      currency: 'EUR',
      status: 'active',
      productType: 'physical',
      inStock: true,
      inventoryQuantity: 30,
      requiresShipping: true,
      vatIncluded: true,
      vatRate: 23,
      categoryId: 'cat-accessories',
    },
  ]

  for (const product of products) {
    const { categoryId, ...productData } = product
    await database.insert(schema.products).values(productData).onConflictDoNothing()

    await database.insert(schema.productCategories).values({
      productId: product.id,
      categoryId,
    }).onConflictDoNothing()
  }

  // ---- Product Images ----
  const images = [
    { id: 'img-prod-1', productId: 'prod-1', url: 'https://placehold.co/600x600/f0f0f0/333/png?text=T-Shirt', altText: 'Cotton T-Shirt', isPrimary: true, sortOrder: 1 },
    { id: 'img-prod-2', productId: 'prod-2', url: 'https://placehold.co/600x600/1a1a2e/e0e0e0/png?text=Earbuds', altText: 'Wireless Earbuds', isPrimary: true, sortOrder: 1 },
    { id: 'img-prod-3', productId: 'prod-3', url: 'https://placehold.co/600x600/8b4513/fff/png?text=Bag', altText: 'Leather Bag', isPrimary: true, sortOrder: 1 },
  ]

  for (const image of images) {
    await database.insert(schema.productImages).values(image).onConflictDoNothing()
  }

  // ---- Product Variants (for t-shirt) ----
  const variants = [
    {
      id: 'var-tshirt-s',
      productId: 'prod-1',
      name: { en: 'Small', pt: 'Pequeno', es: 'Pequeño' },
      sku: 'TSHIRT-S',
      price: '29.00',
      inStock: true,
      inventoryQuantity: 50,
      sortOrder: 1,
    },
    {
      id: 'var-tshirt-m',
      productId: 'prod-1',
      name: { en: 'Medium', pt: 'Médio', es: 'Mediano' },
      sku: 'TSHIRT-M',
      price: '29.00',
      inStock: true,
      inventoryQuantity: 60,
      sortOrder: 2,
    },
    {
      id: 'var-tshirt-l',
      productId: 'prod-1',
      name: { en: 'Large', pt: 'Grande', es: 'Grande' },
      sku: 'TSHIRT-L',
      price: '32.00',
      inStock: true,
      inventoryQuantity: 40,
      sortOrder: 3,
    },
  ]

  for (const v of variants) {
    await database.insert(schema.productVariants).values(v).onConflictDoNothing()
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
    await database.insert(schema.brands).values(brand).onConflictDoNothing()
  }

  // ---- Reviews ----
  const reviewsList = [
    { id: 'rev-1', productId: 'prod-1', authorName: 'Inês', rating: 5, title: 'Excellent quality', body: 'Best t-shirt I have ever bought. The cotton is incredibly soft.', verified: true, status: 'published' },
    { id: 'rev-2', productId: 'prod-1', authorName: 'Miguel', rating: 4, title: 'Good fit', body: 'Nice shirt, true to size. Would buy again.', verified: true, status: 'published' },
    { id: 'rev-3', productId: 'prod-1', authorName: 'Sofia', rating: 5, title: 'Love it', body: 'Perfect for everyday wear.', verified: false, status: 'published' },
    { id: 'rev-4', productId: 'prod-2', authorName: 'Lucía', rating: 5, title: 'Amazing sound', body: 'Crystal clear audio and the noise cancellation is top-notch.', verified: true, status: 'published' },
    { id: 'rev-5', productId: 'prod-2', authorName: 'Tomás', rating: 3, title: 'Decent', body: 'Good sound but battery life could be better.', verified: true, status: 'published' },
    { id: 'rev-6', productId: 'prod-3', authorName: 'Clara', rating: 4, title: 'Beautiful bag', body: 'Gorgeous leather, arrived well-packaged.', verified: true, status: 'published' },
  ]

  for (const review of reviewsList) {
    await database.insert(schema.reviews).values(review).onConflictDoNothing()
  }
}
