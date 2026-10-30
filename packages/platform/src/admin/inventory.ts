// ---------------------------------------------------------------------------
// Admin: Inventory management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Product } from '@prood/types'
import type { UpdateInventoryInput } from './types.js'
import {
  findProductById,
  updateProductById,
  updateProductVariantById,
  findProductVariants,
} from '../database/index.js'
import { mapProduct } from '../domains/product-mapper.js'

export function createAdminInventoryDomain() {
  return {
    async updateInventory(input: UpdateInventoryInput): Promise<void> {
      const adjustment = input.adjustment ?? 'set'

      if (input.variantId) {
        // Update variant inventory
        if (adjustment === 'set') {
          await updateProductVariantById(input.variantId, {
            inventoryQuantity: input.quantity,
            inStock: input.quantity > 0,
          })
        } else {
          const variants = await findProductVariants(input.productId)
          const variant = variants.find((v: any) => v.id === input.variantId)
          if (!variant) throw new CommerceError(`Variant not found: ${input.variantId}`, "NOT_FOUND")

          const current = variant.inventoryQuantity ?? 0
          const newQty = adjustment === 'increment' ? current + input.quantity : current - input.quantity
          await updateProductVariantById(input.variantId, {
            inventoryQuantity: Math.max(0, newQty),
            inStock: newQty > 0,
          })
        }
      } else {
        // Update product-level inventory
        if (adjustment === 'set') {
          await updateProductById(input.productId, {
            inventoryQuantity: input.quantity,
            inStock: input.quantity > 0,
          })
        } else {
          const product = await findProductById(input.productId)
          if (!product) throw new CommerceError(`Product not found: ${input.productId}`, "NOT_FOUND")

          const current = (product as any).inventoryQuantity ?? 0
          const newQty = adjustment === 'increment' ? current + input.quantity : current - input.quantity
          await updateProductById(input.productId, {
            inventoryQuantity: Math.max(0, newQty),
            inStock: newQty > 0,
          })
        }
      }
    },

    async getLowStockProducts(threshold?: number): Promise<Product[]> {
      const { adminFindLowStockProducts } = await import('../database/drizzle/queries/admin-catalog.js')
      const limit = threshold ?? 10

      const rows = await adminFindLowStockProducts(limit, 50)

      return Promise.all(rows.map(mapProduct))
    },
  }
}
