// ---------------------------------------------------------------------------
// Admin API factory — assembles all admin domain modules into a single API
// ---------------------------------------------------------------------------

import type { AdminAPI } from './types.js'
import { createAdminProductsDomain } from './products.js'
import { createAdminCategoriesDomain } from './categories.js'
import { createAdminOrdersDomain } from './orders.js'
import { createAdminCustomersDomain } from './customers.js'
import { createAdminStoreDomain } from './store.js'
import { createAdminInventoryDomain } from './inventory.js'
import {
  countOrdersByStatus,
  sumOrderRevenue,
  findRecentOrders,
  countCustomers,
  countProducts,
  countActiveProducts,
  countOrders,
} from '../database/index.js'
import { mapOrder } from '../domains/order-mapper.js'

/**
 * Create an AdminAPI — the merchant-facing management interface.
 *
 * Only available for the native platform (Prood Cloud).
 * External adapters manage their own admin dashboards.
 *
 * @example
 * ```ts
 * const { adapter, admin } = await createPlatformAdapter()
 * const product = await admin.createProduct({ name: 'T-Shirt', price: 99 })
 * ```
 */
export function createAdminAPI(): AdminAPI {
  const products = createAdminProductsDomain()
  const categories = createAdminCategoriesDomain()
  const orders = createAdminOrdersDomain()
  const customers = createAdminCustomersDomain()
  const store = createAdminStoreDomain()
  const inventory = createAdminInventoryDomain()

  return {
    // Auth
    // Products
    getProduct: products.getProduct,
    createProduct: products.createProduct,
    updateProduct: products.updateProduct,
    deleteProduct: products.deleteProduct,
    listProducts: products.listProducts,

    // Categories
    createCategory: categories.createCategory,
    updateCategory: categories.updateCategory,
    deleteCategory: categories.deleteCategory,

    // Orders
    listOrders: orders.listOrders,
    getOrder: orders.getOrder,
    fulfillOrder: orders.fulfillOrder,
    recordRefund: orders.recordRefund,

    // Customers
    listCustomers: customers.listCustomers,
    getCustomer: customers.getCustomer,
    deleteCustomer: customers.deleteCustomer,

    // Store
    getStoreSettings: store.getStoreSettings,
    updateStoreSettings: store.updateStoreSettings,

    // Inventory
    updateInventory: inventory.updateInventory,
    getLowStockProducts: inventory.getLowStockProducts,

    // Dashboard stats
    async getDashboardStats() {
      const [
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        ordersByStatus,
        recentOrderRows,
      ] = await Promise.all([
        countProducts(),
        countActiveProducts(),
        countOrders(),
        sumOrderRevenue(),
        countCustomers(),
        countOrdersByStatus(),
        findRecentOrders(5),
      ])

      const recentOrders = await Promise.all(recentOrderRows.map(mapOrder))

      return {
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        recentOrders,
        ordersByStatus,
      }
    },
  }
}

// Re-export types
export type { AdminAPI } from './types.js'
export type {
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AdminListOrdersParams,
  FulfillOrderInput,
  UpdateStoreInput,
  StoreSettings,
  UpdateInventoryInput,
  DashboardStats,
  AdminListParams,
  CreateProductImageInput,
  CreateVariantInput,
  CreateAttributeInput,
} from './types.js'
