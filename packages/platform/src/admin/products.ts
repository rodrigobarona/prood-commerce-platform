// ---------------------------------------------------------------------------
// Admin: Product CRUD
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Product } from '@prood/types'
import type { AdminListParams, CreateProductInput, UpdateProductInput } from './types.js'
import {
  findProductById,
  findProductBySlug,
  insertProduct,
  updateProductById,
  deleteProductById,
  findAllProducts,
  insertProductImage,
  deleteProductImages,
  insertProductVariant,
  deleteProductVariants,
  insertProductAttribute,
  deleteProductAttributes,
  insertProductTag,
  deleteProductTags,
  setProductCategories,
} from '../database/index.js'
import { slugifyLocalized } from '../domains/helpers.js'
import { mapProduct } from '../domains/product-mapper.js'

export function createAdminProductsDomain(currency: string) {
  async function fullProduct(id: string): Promise<Product> {
    const row = await findProductById(id)
    if (!row) throw new CommerceError(`Product not found: ${id}`, "NOT_FOUND")
    return mapProduct(row)
  }

  return {
    getProduct: fullProduct,

    async createProduct(input: CreateProductInput): Promise<Product> {
      const id = crypto.randomUUID()

      let slug = input.slug ?? slugifyLocalized(input.name)
      const existing = await findProductBySlug(slug)
      if (existing) slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`

      await insertProduct({
        id,
        name: input.name,
        slug,
        description: input.description ?? null,
        shortDescription: input.shortDescription ?? null,
        price: input.price ?? null,
        compareAtPrice: input.compareAtPrice ?? null,
        currency: input.currency ?? currency,
        sku: input.sku ?? null,
        productType: input.productType ?? 'physical',
        status: input.status ?? 'draft',
        inStock: input.inStock ?? true,
        inventoryQuantity: input.inventoryQuantity ?? null,
        quantityLimit: input.quantityLimit ?? null,
        vatIncluded: input.vatIncluded ?? true,
        vatRate: input.vatRate ?? null,
        requiresShipping: input.requiresShipping ?? true,
        isDropshipped: input.isDropshipped ?? false,
      })

      if (input.images?.length) {
        for (let i = 0; i < input.images.length; i++) {
          const image = input.images[i]
          await insertProductImage({
            id: crypto.randomUUID(),
            productId: id,
            url: image.url,
            altText: image.altText ?? null,
            sortOrder: image.sortOrder ?? i,
            isPrimary: image.isPrimary ?? (i === 0),
          })
        }
      }

      if (input.variants?.length) {
        for (let i = 0; i < input.variants.length; i++) {
          const v = input.variants[i]
          await insertProductVariant({
            id: crypto.randomUUID(),
            productId: id,
            sku: v.sku ?? null,
            name: v.name ?? null,
            price: v.price ?? null,
            compareAtPrice: v.compareAtPrice ?? null,
            inStock: v.inStock ?? true,
            inventoryQuantity: v.inventoryQuantity ?? null,
            sortOrder: v.sortOrder ?? i,
          })
        }
      }

      if (input.attributes?.length) {
        for (const attr of input.attributes) {
          await insertProductAttribute({
            id: crypto.randomUUID(),
            productId: id,
            code: attr.code,
            name: attr.name,
            value: attr.value,
          })
        }
      }

      if (input.tags?.length) {
        for (const tag of input.tags) {
          await insertProductTag({ id: crypto.randomUUID(), productId: id, tag })
        }
      }

      if (input.categories?.length) {
        await setProductCategories(id, input.categories)
      }

      return fullProduct(id)
    },

    async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
      const updates: Record<string, unknown> = {}

      if (input.name != null) updates.name = input.name
      if (input.slug != null) updates.slug = input.slug
      if (input.description !== undefined) updates.description = input.description
      if (input.shortDescription !== undefined) updates.shortDescription = input.shortDescription
      if (input.price !== undefined) updates.price = input.price
      if (input.compareAtPrice !== undefined) updates.compareAtPrice = input.compareAtPrice
      if (input.currency != null) updates.currency = input.currency
      if (input.sku !== undefined) updates.sku = input.sku
      if (input.productType != null) updates.productType = input.productType
      if (input.status != null) updates.status = input.status
      if (input.inStock != null) updates.inStock = input.inStock
      if (input.inventoryQuantity !== undefined) updates.inventoryQuantity = input.inventoryQuantity
      if (input.quantityLimit !== undefined) updates.quantityLimit = input.quantityLimit
      if (input.vatIncluded != null) updates.vatIncluded = input.vatIncluded
      if (input.vatRate !== undefined) updates.vatRate = input.vatRate
      if (input.requiresShipping != null) updates.requiresShipping = input.requiresShipping
      if (input.isDropshipped != null) updates.isDropshipped = input.isDropshipped

      await updateProductById(id, updates)

      if (input.images) {
        await deleteProductImages(id)
        for (let i = 0; i < input.images.length; i++) {
          const image = input.images[i]
          await insertProductImage({
            id: crypto.randomUUID(),
            productId: id,
            url: image.url,
            altText: image.altText ?? null,
            sortOrder: image.sortOrder ?? i,
            isPrimary: image.isPrimary ?? (i === 0),
          })
        }
      }

      if (input.variants) {
        await deleteProductVariants(id)
        for (let i = 0; i < input.variants.length; i++) {
          const v = input.variants[i]
          await insertProductVariant({
            id: crypto.randomUUID(),
            productId: id,
            sku: v.sku ?? null,
            name: v.name ?? null,
            price: v.price ?? null,
            compareAtPrice: v.compareAtPrice ?? null,
            inStock: v.inStock ?? true,
            inventoryQuantity: v.inventoryQuantity ?? null,
            sortOrder: v.sortOrder ?? i,
          })
        }
      }

      if (input.attributes) {
        await deleteProductAttributes(id)
        for (const attr of input.attributes) {
          await insertProductAttribute({
            id: crypto.randomUUID(),
            productId: id,
            code: attr.code,
            name: attr.name,
            value: attr.value,
          })
        }
      }

      if (input.tags) {
        await deleteProductTags(id)
        for (const tag of input.tags) {
          await insertProductTag({ id: crypto.randomUUID(), productId: id, tag })
        }
      }

      if (input.categories) {
        await setProductCategories(id, input.categories)
      }

      return fullProduct(id)
    },

    async deleteProduct(id: string): Promise<void> {
      await deleteProductById(id)
    },

    async listProducts(params?: AdminListParams) {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findAllProducts({
        search: params?.search,
        sort: params?.sort,
        limit: perPage,
        offset,
      })

      const products = await Promise.all(rows.map(mapProduct))

      return {
        items: products,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },
  }
}
