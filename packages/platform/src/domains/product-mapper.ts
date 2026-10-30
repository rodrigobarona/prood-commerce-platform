// ---------------------------------------------------------------------------
// Product mapper — the one mapping from a stored product to the unified type
// ---------------------------------------------------------------------------

import type { Product, ProductType } from '@prood/types'
import type { products } from '../database/drizzle/schema/products.js'
import {
  findProductImages,
  findProductVariants,
  findProductAttributes,
  findProductCategoryIds,
  findProductTags,
  findCategoryById,
  getReviewSummaryByProduct,
} from '../database/index.js'
import { mapCategory } from './category-mapper.js'
import { normalizeLocalizedField, discountablePrice, img, roundRating } from './helpers.js'

async function fetchProductRelations(productId: string) {
  const [images, variants, attributes, categoryIds, tags, reviews] = await Promise.all([
    findProductImages(productId),
    findProductVariants(productId),
    findProductAttributes(productId),
    findProductCategoryIds(productId),
    findProductTags(productId),
    getReviewSummaryByProduct(productId),
  ])

  const categories = categoryIds.length > 0
    ? (await Promise.all(categoryIds.map(id => findCategoryById(id)))).filter(c => c !== null)
    : []

  return { images, variants, attributes, categories, tags, reviews }
}

/** Prices use the product's own currency, whoever reads it. */
export async function mapProduct(row: typeof products.$inferSelect): Promise<Product> {
  const related = await fetchProductRelations(row.id)
  const primaryImg = related.images.find((i: any) => i.isPrimary) ?? related.images[0]

  return {
    id: row.id,
    sku: row.sku,
    name: normalizeLocalizedField(row.name),
    slug: row.slug,
    description: normalizeLocalizedField(row.description),
    shortDescription: normalizeLocalizedField(row.shortDescription),
    price: discountablePrice(row.price, row.compareAtPrice, row.currency),
    primaryImage: primaryImg ? img(primaryImg.url, primaryImg.altText) : null,
    gallery: related.images.map((i: any) => img(i.url, i.altText)),
    rating: related.reviews.totalReviews > 0
      ? { average: roundRating(related.reviews.averageRating), count: related.reviews.totalReviews }
      : null,
    variants: related.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku ?? null,
      name: v.name ? normalizeLocalizedField(v.name) : null,
      price: discountablePrice(v.price, v.compareAtPrice, row.currency),
      inStock: Boolean(v.inStock),
      inventoryQuantity: v.inventoryQuantity ?? null,
    })),
    attributes: related.attributes.map((a: any) => ({
      code: a.code,
      name: normalizeLocalizedField(a.name),
      value: normalizeLocalizedField(a.value),
    })),
    quantityLimit: row.quantityLimit,
    categories: related.categories.map(mapCategory),
    inStock: row.inStock,
    vatIncluded: row.vatIncluded,
    vatRate: row.vatRate,
    tags: related.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    productType: row.productType as ProductType,
    requiresShipping: row.requiresShipping,
    isDropshipped: row.isDropshipped,
    status: row.status,
  }
}
