// ---------------------------------------------------------------------------
// Seed — populate the database with the demo store (Drizzle + Neon)
// ---------------------------------------------------------------------------

import { and, eq, isNull, sql } from 'drizzle-orm'
import { getDb, withTenant } from './client.js'
import * as schema from './schema/index.js'

/**
 * Demo tenant id. The demo storefront resolves to it through the organization
 * slug `prood-demo` (e.g. `prood-demo.localhost`).
 */
export const DEMO_ORG_ID = 'org_demo'

/** Graded brand photography, see packages/media. */
const MEDIA = 'https://prood-media.rbarona.workers.dev/brand/v1'

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
    VALUES (${DEMO_ORG_ID}, 'Casa Exemplo', 'prood-demo')
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
      en: 'Casa Exemplo',
      pt: 'Casa Exemplo',
      es: 'Casa Exemplo',
    },
    description: {
      en: 'Stoneware, linen and small things for the table.',
      pt: 'Grés, linho e pequenas coisas para a mesa.',
      es: 'Gres, lino y pequeñas cosas para la mesa.',
    },
    currency: 'EUR',
    locale: 'en',
    timezone: 'Europe/Lisbon',
    country: 'PT',
    supportedCurrencies: ['EUR'],
    supportedLocales: ['en', 'pt', 'es'],
  }).onConflictDoNothing()

  // ---- Categories ----
  const categories = [
    {
      id: 'cat-clothing',
      name: { en: 'Tableware', pt: 'Mesa', es: 'Mesa' },
      slug: 'tableware',
      sortOrder: 1,
    },
    {
      id: 'cat-electronics',
      name: { en: 'Linen', pt: 'Linho', es: 'Lino' },
      slug: 'linen',
      sortOrder: 2,
    },
    {
      id: 'cat-accessories',
      name: { en: 'Living', pt: 'Casa', es: 'Hogar' },
      slug: 'living',
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
        en: 'Stoneware mug',
        pt: 'Caneca de grés',
        es: 'Taza de gres',
      },
      slug: 'stoneware-mug',
      shortDescription: {
        en: 'A steady everyday mug, glazed white to the waist with the clay left bare below.',
        pt: 'Uma caneca firme para todos os dias, vidrada a branco até meio, com o barro à vista por baixo.',
        es: 'Una taza firme para cada día, esmaltada en blanco hasta la mitad, con el barro a la vista debajo.',
      },
      description: {
        en: 'Example product. Speckled stoneware with a white glaze, in three sizes. The sizes and details below are examples too.',
        pt: 'Produto de exemplo. Grés salpicado com vidrado branco, em três tamanhos. Os tamanhos e detalhes abaixo também são exemplos.',
        es: 'Producto de ejemplo. Gres moteado con esmalte blanco, en tres tamaños. Los tamaños y detalles de abajo también son ejemplos.',
      },
      price: '29.00',
      compareAtPrice: '39.00',
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
        en: 'Striped linen runner',
        pt: 'Caminho de mesa de linho às riscas',
        es: 'Camino de mesa de lino a rayas',
      },
      slug: 'striped-linen-runner',
      shortDescription: {
        en: 'A long linen runner with a blue stripe, for a table that sees daily use.',
        pt: 'Um caminho de mesa comprido em linho, com risca azul, para o uso de todos os dias.',
        es: 'Un camino de mesa largo de lino con raya azul, para el uso de cada día.',
      },
      description: {
        en: 'Example product. Striped linen table runner. The details below are examples too.',
        pt: 'Produto de exemplo. Caminho de mesa de linho às riscas. Os detalhes abaixo também são exemplos.',
        es: 'Producto de ejemplo. Camino de mesa de lino a rayas. Los detalles de abajo también son ejemplos.',
      },
      price: '79.00',
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
        en: 'Terracotta dinner set',
        pt: 'Serviço de jantar em terracota',
        es: 'Vajilla de terracota',
      },
      slug: 'terracotta-dinner-set',
      shortDescription: {
        en: 'Plain terracotta plates, enough to set a table for four.',
        pt: 'Pratos simples de terracota, que chegam para pôr a mesa para quatro.',
        es: 'Platos sencillos de terracota, suficientes para poner la mesa para cuatro.',
      },
      description: {
        en: 'Example product. Four terracotta dinner plates and four side plates. The details below are examples too.',
        pt: 'Produto de exemplo. Quatro pratos rasos e quatro de sobremesa em terracota. Os detalhes abaixo também são exemplos.',
        es: 'Producto de ejemplo. Cuatro platos llanos y cuatro de postre de terracota. Los detalles de abajo también son ejemplos.',
      },
      price: '149.00',
      compareAtPrice: '189.00',
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
    { id: 'img-prod-1', productId: 'prod-1', url: `${MEDIA}/product-mug-glazed-6f508dab.jpg`, altText: 'A stoneware mug with a speckled white glaze over a bare clay base, filled with coffee', isPrimary: true, sortOrder: 1 },
    { id: 'img-prod-2', productId: 'prod-2', url: `${MEDIA}/product-linen-a0fa5ed4.jpg`, altText: 'Folded striped linen tied with twine', isPrimary: true, sortOrder: 1 },
    { id: 'img-prod-3', productId: 'prod-3', url: `${MEDIA}/product-plates-81331903.jpg`, altText: 'Terracotta plates on a kiln shelf', isPrimary: true, sortOrder: 1 },
  ]

  for (const image of images) {
    await database.insert(schema.productImages).values(image).onConflictDoNothing()
  }

  // ---- Product Variants (the capacities are example content) ----
  const variants = [
    {
      id: 'var-tshirt-s',
      productId: 'prod-1',
      name: { en: '250 ml', pt: '250 ml', es: '250 ml' },
      sku: 'MUG-S',
      price: '29.00',
      compareAtPrice: '39.00',
      inStock: true,
      inventoryQuantity: 50,
      sortOrder: 1,
    },
    {
      id: 'var-tshirt-m',
      productId: 'prod-1',
      name: { en: '350 ml', pt: '350 ml', es: '350 ml' },
      sku: 'MUG-M',
      price: '29.00',
      compareAtPrice: '39.00',
      inStock: true,
      inventoryQuantity: 60,
      sortOrder: 2,
    },
    {
      id: 'var-tshirt-l',
      productId: 'prod-1',
      name: { en: '450 ml', pt: '450 ml', es: '450 ml' },
      sku: 'MUG-L',
      price: '32.00',
      compareAtPrice: '42.00',
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
      name: { en: 'Casa Exemplo', pt: 'Casa Exemplo', es: 'Casa Exemplo' },
      slug: 'casa-exemplo',
      isActive: true,
    },
    {
      id: 'brand-2',
      name: { en: 'Tear do Norte', pt: 'Tear do Norte', es: 'Tear do Norte' },
      slug: 'tear-do-norte',
      isActive: true,
    },
    {
      id: 'brand-3',
      name: { en: 'Olaria do Sul', pt: 'Olaria do Sul', es: 'Olaria do Sul' },
      slug: 'olaria-do-sul',
      isActive: true,
    },
  ]

  for (const brand of brands) {
    await database.insert(schema.brands).values(brand).onConflictDoNothing()
  }
}

/** Library photographs by file name, so a product's gallery reads as one list. */
const PHOTOS = {
  mugHandle: { image: 'product-mug-glazed-handle-1c3780f6.jpg', alt: "The mug's handle up close, and the speckled white glaze stopping at a band of bare clay" },
  linenFork: { image: 'product-linen-fork-d88ab0c3.jpg', alt: 'The striped linen folded on a wooden worktop under a wooden fork and spoon' },
  linenKitchen: { image: 'product-linen-kitchen-d6adc110.jpg', alt: 'The striped linen on a kitchen worktop beside a loaf of bread and glass jars' },
  candle: { image: 'product-candle-099ff759.jpg', alt: 'Amber glass candle with a wooden lid on terracotta paper' },
  candleHand: { image: 'product-candle-hand-f84692ba.jpg', alt: 'A hand holding the amber glass candle, closed with its wooden lid' },
  candles: { image: 'product-candles-8fbeaf34.jpg', alt: 'Three lit amber glass candles on crumpled paper' },
} as const

/** The rest of the demo range, so the storefront reads as a real store. */
const showcase = [
  { id: 'prod-4', slug: 'cream-mug', price: '24.00', category: 'cat-clothing', image: 'product-mug-b367ed10.jpg', alt: 'A hand-shaped cream mug with a round handle on a dark wooden shelf', name: { en: 'Cream mug', pt: 'Caneca creme', es: 'Taza crema' }, shortDescription: { en: 'Shaped by hand, with a soft cream glaze and a round handle.', pt: 'Moldada à mão, com um vidrado creme suave e uma asa redonda.', es: 'Modelada a mano, con un esmalte crema suave y un asa redonda.' }, description: { en: 'Example product. Hand-shaped stoneware mug with a cream glaze. The details below are examples too.', pt: 'Produto de exemplo. Caneca de grés moldada à mão com vidrado creme. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Taza de gres modelada a mano con esmalte crema. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-5', slug: 'glazed-bowls', price: '58.00', category: 'cat-clothing', image: 'product-bowls-4ad81b9c.jpg', alt: 'A stack of glazed stoneware bowls', name: { en: 'Glazed bowls, set of 4', pt: 'Taças vidradas, conjunto de 4', es: 'Cuencos esmaltados, juego de 4' }, shortDescription: { en: 'Wide, deep bowls that stack neatly on a shelf.', pt: 'Taças largas e fundas que empilham bem na prateleira.', es: 'Cuencos anchos y hondos que se apilan bien en la estantería.' }, description: { en: 'Example product. Four glazed bowls for soup or pasta. The details below are examples too.', pt: 'Produto de exemplo. Quatro taças vidradas para sopa ou massa. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Cuatro cuencos esmaltados para sopa o pasta. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-6', slug: 'coffee-tumblers', price: '42.00', category: 'cat-clothing', image: 'cafe-pour-7e6e5c20.jpg', alt: 'A hand pours coffee from a glass carafe into three tumblers', name: { en: 'Coffee tumblers, set of 3', pt: 'Copos de café, conjunto de 3', es: 'Vasos de café, juego de 3' }, shortDescription: { en: 'Short, thick glasses for filter coffee.', pt: 'Copos baixos e grossos para café de filtro.', es: 'Vasos bajos y gruesos para café de filtro.' }, description: { en: 'Example product. Three glass tumblers for coffee. The details below are examples too.', pt: 'Produto de exemplo. Três copos de vidro para café. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Tres vasos de vidrio para café. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-7', slug: 'speckled-plate', price: '19.00', category: 'cat-clothing', image: 'product-plate-speckled-b177ac5b.jpg', alt: 'Speckled plate displayed on draped linen', name: { en: 'Speckled side plate', pt: 'Prato de sobremesa salpicado', es: 'Plato de postre moteado' }, shortDescription: { en: 'A small pale plate with a dark speckle.', pt: 'Um prato pequeno e claro, com salpicos escuros.', es: 'Un plato pequeño y claro con motas oscuras.' }, description: { en: 'Example product. Speckled side plate. The details below are examples too.', pt: 'Produto de exemplo. Prato de sobremesa salpicado. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Plato de postre moteado. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-8', slug: 'stone-linen-cloth', price: '46.00', category: 'cat-electronics', image: 'product-linen-stone-f09b3000.jpg', alt: 'A folded stone-grey linen cloth tied with twine on a wooden worktop', name: { en: 'Stone linen cloth', pt: 'Pano de linho pedra', es: 'Paño de lino piedra' }, shortDescription: { en: 'A plain, heavy cloth for bread or a small table.', pt: 'Um pano liso e pesado para o pão ou uma mesa pequena.', es: 'Un paño liso y pesado para el pan o una mesa pequeña.' }, description: { en: 'Example product. Plain stone-grey linen cloth. The details below are examples too.', pt: 'Produto de exemplo. Pano de linho liso, cor de pedra. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Paño de lino liso, color piedra. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-9', slug: 'amber-candle', price: '22.00', category: 'cat-accessories', image: 'product-candle-lid-5cf0ef35.jpg', alt: 'An amber glass candle from above, its wooden lid resting beside it', name: { en: 'Amber candle', pt: 'Vela âmbar', es: 'Vela ámbar' }, shortDescription: { en: 'One candle in amber glass, with a wooden lid to put it out.', pt: 'Uma vela em vidro âmbar, com tampa de madeira para a apagar.', es: 'Una vela en vidrio ámbar, con tapa de madera para apagarla.' }, description: { en: 'Example product. Candle in amber glass with a wooden lid. The details below are examples too.', pt: 'Produto de exemplo. Vela em vidro âmbar com tampa de madeira. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Vela en vidrio ámbar con tapa de madera. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-10', slug: 'candle-trio', price: '54.00', category: 'cat-accessories', image: 'product-candles-top-36e09698.jpg', alt: 'Three lit amber glass candles seen from above on brown paper', name: { en: 'Candle trio', pt: 'Trio de velas', es: 'Trío de velas' }, shortDescription: { en: 'Three small jars to spread along a table.', pt: 'Três frascos pequenos para espalhar pela mesa.', es: 'Tres tarros pequeños para repartir por la mesa.' }, description: { en: 'Example product. Three candles in small amber jars. The details below are examples too.', pt: 'Produto de exemplo. Três velas em frascos âmbar pequenos. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Tres velas en tarros ámbar pequeños. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-11', slug: 'olive-soap', price: '16.00', category: 'cat-accessories', image: 'product-soap-5b684d6a.jpg', alt: 'A stack of four handmade soap bars', name: { en: 'Olive oil soap, 4 bars', pt: 'Sabonete de azeite, 4 barras', es: 'Jabón de aceite de oliva, 4 pastillas' }, shortDescription: { en: 'Plain, heavy bars for the kitchen sink or the bath.', pt: 'Barras simples e pesadas para a cozinha ou o banho.', es: 'Pastillas sencillas y pesadas para la cocina o el baño.' }, description: { en: 'Example product. Four bars of olive oil soap. The details below are examples too.', pt: 'Produto de exemplo. Quatro barras de sabonete de azeite. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Cuatro pastillas de jabón de aceite de oliva. Los detalles de abajo también son ejemplos.' } },
  { id: 'prod-12', slug: 'oil-bottles', price: '36.00', category: 'cat-clothing', image: 'product-oil-2220304b.jpg', alt: 'Two ceramic oil bottles on a kitchen shelf', name: { en: 'Oil and vinegar bottles', pt: 'Galheteiro', es: 'Aceitera y vinagrera' }, shortDescription: { en: 'A matching pair with pouring spouts, for the table or the stove.', pt: 'Um par a condizer com bicos vertedores, para a mesa ou o fogão.', es: 'Una pareja a juego con picos vertedores, para la mesa o la cocina.' }, description: { en: 'Example product. A pair of ceramic bottles for oil and vinegar. The details below are examples too.', pt: 'Produto de exemplo. Um par de garrafas de cerâmica para azeite e vinagre. Os detalhes abaixo também são exemplos.', es: 'Producto de ejemplo. Un par de botellas de cerámica para aceite y vinagre. Los detalles de abajo también son ejemplos.' } },
] as const

/** The same text in every language, for measures. */
const measure = (value: string) => ({ en: value, pt: value, es: value })

const FACT_NAMES = {
  capacity: { en: 'Capacity', pt: 'Capacidade', es: 'Capacidad' },
  size: { en: 'Size', pt: 'Tamanho', es: 'Tamaño' },
  weight: { en: 'Weight', pt: 'Peso', es: 'Peso' },
  pieces: { en: 'In the set', pt: 'No conjunto', es: 'En el juego' },
  finish: { en: 'Finish', pt: 'Acabamento', es: 'Acabado' },
}

type Fact = keyof typeof FACT_NAMES

/**
 * More photographs of each demo product and its facts, in the gallery's and the
 * list's order. A gallery only shows the product: with no second frame of it,
 * one strong photograph beats padding. Every measure is example content.
 */
const productDetails: Record<string, { photos: (keyof typeof PHOTOS)[]; material: { en: string; pt: string; es: string }; facts: Partial<Record<Fact, { en: string; pt: string; es: string }>> }> = {
  'prod-1': { photos: ['mugHandle'], material: { en: 'Stoneware', pt: 'Grés', es: 'Gres' }, facts: { capacity: { en: '250, 350 or 450 ml', pt: '250, 350 ou 450 ml', es: '250, 350 o 450 ml' }, finish: { en: 'Speckled white glaze', pt: 'Vidrado branco salpicado', es: 'Esmalte blanco moteado' } } },
  'prod-2': { photos: ['linenFork', 'linenKitchen'], material: { en: 'Linen', pt: 'Linho', es: 'Lino' }, facts: { size: measure('45 × 180 cm'), finish: { en: 'Woven stripe', pt: 'Risca tecida', es: 'Raya tejida' } } },
  'prod-3': { photos: [], material: { en: 'Terracotta', pt: 'Terracota', es: 'Terracota' }, facts: { size: { en: 'Dinner plate 27 cm, side plate 20 cm', pt: 'Prato raso 27 cm, sobremesa 20 cm', es: 'Plato llano 27 cm, postre 20 cm' }, pieces: { en: '8 plates', pt: '8 pratos', es: '8 platos' } } },
  'prod-4': { photos: [], material: { en: 'Stoneware', pt: 'Grés', es: 'Gres' }, facts: { capacity: measure('300 ml'), finish: { en: 'Cream glaze', pt: 'Vidrado creme', es: 'Esmalte crema' } } },
  'prod-5': { photos: [], material: { en: 'Stoneware', pt: 'Grés', es: 'Gres' }, facts: { size: { en: '18 cm across', pt: '18 cm de diâmetro', es: '18 cm de diámetro' }, capacity: measure('600 ml'), pieces: { en: '4 bowls', pt: '4 taças', es: '4 cuencos' } } },
  'prod-6': { photos: [], material: { en: 'Glass', pt: 'Vidro', es: 'Vidrio' }, facts: { capacity: measure('220 ml'), pieces: { en: '3 tumblers', pt: '3 copos', es: '3 vasos' } } },
  'prod-7': { photos: [], material: { en: 'Stoneware', pt: 'Grés', es: 'Gres' }, facts: { size: { en: '20 cm across', pt: '20 cm de diâmetro', es: '20 cm de diámetro' }, finish: { en: 'Speckled glaze', pt: 'Vidrado salpicado', es: 'Esmalte moteado' } } },
  'prod-8': { photos: [], material: { en: 'Linen', pt: 'Linho', es: 'Lino' }, facts: { size: measure('50 × 70 cm'), finish: { en: 'Plain weave', pt: 'Tecido liso', es: 'Tejido liso' } } },
  'prod-9': { photos: ['candle', 'candleHand'], material: { en: 'Wax and amber glass', pt: 'Cera e vidro âmbar', es: 'Cera y vidrio ámbar' }, facts: { capacity: measure('200 ml'), size: { en: '8 cm tall', pt: '8 cm de altura', es: '8 cm de alto' } } },
  'prod-10': { photos: ['candles'], material: { en: 'Wax and amber glass', pt: 'Cera e vidro âmbar', es: 'Cera y vidrio ámbar' }, facts: { capacity: { en: '100 ml each', pt: '100 ml cada', es: '100 ml cada uno' }, pieces: { en: '3 candles', pt: '3 velas', es: '3 velas' } } },
  'prod-11': { photos: [], material: { en: 'Olive oil soap', pt: 'Sabonete de azeite', es: 'Jabón de aceite de oliva' }, facts: { weight: { en: '100 g each', pt: '100 g cada', es: '100 g cada una' }, pieces: { en: '4 bars', pt: '4 barras', es: '4 pastillas' } } },
  'prod-12': { photos: [], material: { en: 'Ceramic', pt: 'Cerâmica', es: 'Cerámica' }, facts: { capacity: { en: '500 ml each', pt: '500 ml cada', es: '500 ml cada' }, pieces: { en: '2 bottles', pt: '2 garrafas', es: '2 botellas' } } },
}

/** The order the store leads with: its best photographs first, none repeating the hero. */
const FEATURED = ['prod-1', 'prod-2', 'prod-5', 'prod-10', 'prod-12', 'prod-11', 'prod-7', 'prod-6', 'prod-3', 'prod-8', 'prod-4', 'prod-9']

/** Plausible and plainly marked: the demo promises nothing about care, delivery or returns. */
const productNotes = [
  { code: 'care', name: { en: 'Care', pt: 'Cuidados', es: 'Cuidados' }, value: { en: 'Example copy. Wash by hand or wipe clean, and keep away from direct heat. A real store writes this for each product.', pt: 'Texto de exemplo. Lavar à mão ou limpar com um pano e manter longe do calor direto. Uma loja real escreve isto para cada produto.', es: 'Texto de ejemplo. Lavar a mano o limpiar con un paño y mantener lejos del calor directo. Una tienda real lo escribe para cada producto.' } },
  { code: 'delivery', name: { en: 'Delivery', pt: 'Entrega', es: 'Entrega' }, value: { en: 'Example copy. Standard delivery costs €15.00 and takes 5 to 7 days. Express costs €35.00 and takes 1 to 2 days.', pt: 'Texto de exemplo. A entrega normal custa 15,00 € e demora 5 a 7 dias. A expressa custa 35,00 € e demora 1 a 2 dias.', es: 'Texto de ejemplo. La entrega estándar cuesta 15,00 € y tarda de 5 a 7 días. La exprés cuesta 35,00 € y tarda de 1 a 2 días.' } },
  { code: 'returns', name: { en: 'Returns', pt: 'Devoluções', es: 'Devoluciones' }, value: { en: 'Example copy. Send unused items back within 30 days for a refund. A real store sets its own terms here.', pt: 'Texto de exemplo. Devolva os artigos sem uso em 30 dias para receber o reembolso. Uma loja real define aqui as suas condições.', es: 'Texto de ejemplo. Devuelve los artículos sin usar en 30 días para recibir el reembolso. Una tienda real fija aquí sus condiciones.' } },
]

/**
 * Adds the rest of the demo range, and the photographs and details of every
 * demo product. Kept apart from `seedDrizzle` because the platform tests assert
 * on the three products seeded there.
 */
export async function seedShowcase(): Promise<void> {
  await withTenant(DEMO_ORG_ID, async () => {
    const database = getDb()
    for (const { category, image, alt, ...product } of showcase) {
      await database.insert(schema.products).values({
        ...product,
        status: 'active',
        productType: 'physical',
        inStock: true,
        inventoryQuantity: 24,
        requiresShipping: true,
        vatIncluded: true,
        vatRate: 23,
      }).onConflictDoNothing()
      await database.insert(schema.productCategories).values({ productId: product.id, categoryId: category }).onConflictDoNothing()
      await database.insert(schema.productImages).values({
        id: `img-${product.id}`,
        productId: product.id,
        url: `${MEDIA}/${image}`,
        altText: alt,
        isPrimary: true,
        sortOrder: 1,
      }).onConflictDoNothing()
    }

    for (const [productId, { photos, material, facts }] of Object.entries(productDetails)) {
      for (const [index, photo] of photos.entries()) {
        const { image, alt } = PHOTOS[photo]
        await database.insert(schema.productImages).values({
          id: `img-${productId}-${index + 2}`,
          productId,
          url: `${MEDIA}/${image}`,
          altText: alt,
          sortOrder: index + 2,
        }).onConflictDoNothing()
      }

      const attributes = [
        { code: 'material', name: { en: 'Material', pt: 'Material', es: 'Material' }, value: material },
        ...Object.entries(facts).map(([code, value]) => ({ code, name: FACT_NAMES[code as Fact], value })),
        ...productNotes,
      ]
      for (const attribute of attributes) {
        await database.insert(schema.productAttributes).values({
          id: `attr-${productId}-${attribute.code}`,
          productId,
          ...attribute,
        }).onConflictDoNothing()
      }
    }

    // Seeded under Living, where the platform tests count on it.
    await database.update(schema.productCategories).set({ categoryId: 'cat-clothing' }).where(eq(schema.productCategories.productId, 'prod-3'))

    // "Featured" is newest first, and rows from one transaction would tie.
    const now = Date.now()
    for (const [index, id] of FEATURED.entries()) {
      await database.update(schema.products).set({ createdAt: new Date(now - index * 1000) }).where(eq(schema.products.id, id))
    }

    await database.update(schema.storeInfo)
      .set({ contactEmail: 'ola@casa-exemplo.example' })
      .where(and(eq(schema.storeInfo.organizationId, DEMO_ORG_ID), isNull(schema.storeInfo.contactEmail)))
  })
}
