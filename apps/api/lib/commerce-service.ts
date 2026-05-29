import "server-only"
import {
  getProducts,
  getProduct,
  getCategories,
  getStoreInfo,
  getCountries,
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  getOrder,
  getAdmin,
  withTenant,
} from "@prood/commerce"
import type {
  AddToCartInput,
  AdminListParams,
  AdminListOrdersParams,
  CreateCategoryInput,
  CreateProductInput,
  GetCategoriesParams,
  SearchParams,
  UpdateCategoryInput,
  UpdateInventoryInput,
  UpdateProductInput,
  UpdateStoreInput,
  FulfillOrderInput,
} from "@prood/commerce"
import type {
  AdminListOrdersQuery,
  AdminListQuery,
  SearchProductsQuery,
} from "@/lib/schemas"

// ---------------------------------------------------------------------------
// Tenant-scoped service layer shared by Route Handlers and the MCP server.
//
// Storefront functions take an `orgId` and pass it through as the `tenantId`
// argument (the @prood/commerce functions self-scope and tenant-tag caches).
// Admin functions wrap the admin API in `withTenant(orgId)` so RLS applies.
// ---------------------------------------------------------------------------

function toSearchParams(q: SearchProductsQuery): SearchParams {
  return {
    query: q.query,
    categoryId: q.categoryId,
    page: q.page,
    perPage: q.perPage,
    sort: q.sortField
      ? { field: q.sortField, direction: q.sortDirection ?? "asc" }
      : undefined,
  }
}

function toAdminListParams(q: AdminListQuery): AdminListParams {
  return {
    page: q.page,
    perPage: q.perPage,
    search: q.search,
    sort: q.sortField
      ? { field: q.sortField, direction: q.sortDirection ?? "asc" }
      : undefined,
  }
}

function toAdminListOrdersParams(q: AdminListOrdersQuery): AdminListOrdersParams {
  return {
    page: q.page,
    perPage: q.perPage,
    status: q.status,
    customerId: q.customerId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    search: q.search,
  }
}

export const catalog = {
  searchProducts: (orgId: string, q: SearchProductsQuery) =>
    getProducts(toSearchParams(q), orgId),
  getProduct: (orgId: string, id: string) => getProduct({ id }, orgId),
  getProductBySlug: (orgId: string, slug: string) => getProduct({ slug }, orgId),
  listCategories: (orgId: string, params: GetCategoriesParams) =>
    getCategories(params, orgId),
  getStore: (orgId: string) => getStoreInfo(orgId),
  listCountries: () => getCountries(),
}

export const carts = {
  create: (orgId: string) => createCart(orgId),
  get: (orgId: string, id: string) => getCart(id, orgId),
  addItem: (orgId: string, cartId: string, item: AddToCartInput) =>
    addToCart(cartId, item, orgId),
  updateItem: (orgId: string, cartId: string, itemId: string, quantity: number) =>
    updateCartItem(cartId, itemId, quantity, orgId),
  removeItem: (orgId: string, cartId: string, itemId: string) =>
    removeFromCart(cartId, itemId, orgId),
  applyCoupon: (orgId: string, cartId: string, code: string) =>
    applyCoupon(cartId, code, orgId),
  removeCoupon: (orgId: string, cartId: string) => removeCoupon(cartId, orgId),
}

export const orders = {
  // Tenant-scoped order lookup by id. Customer-scoped order *lists* need an
  // end-customer identity, which the tenant/admin auth surface does not resolve.
  get: (orgId: string, id: string) => getOrder(id, orgId),
}

export const admin = {
  listProducts: (orgId: string, q: AdminListQuery) =>
    withTenant(orgId, async () => (await getAdmin()).listProducts(toAdminListParams(q))),
  getProduct: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getProduct(id)),
  createProduct: (orgId: string, input: CreateProductInput) =>
    withTenant(orgId, async () => (await getAdmin()).createProduct(input)),
  updateProduct: (orgId: string, id: string, input: UpdateProductInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateProduct(id, input)),
  deleteProduct: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).deleteProduct(id)),
  createCategory: (orgId: string, input: CreateCategoryInput) =>
    withTenant(orgId, async () => (await getAdmin()).createCategory(input)),
  updateCategory: (orgId: string, id: string, input: UpdateCategoryInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateCategory(id, input)),
  deleteCategory: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).deleteCategory(id)),
  listOrders: (orgId: string, q: AdminListOrdersQuery) =>
    withTenant(orgId, async () =>
      (await getAdmin()).listOrders(toAdminListOrdersParams(q))
    ),
  getOrder: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getOrder(id)),
  fulfillOrder: (orgId: string, id: string, input: FulfillOrderInput) =>
    withTenant(orgId, async () => (await getAdmin()).fulfillOrder(id, input)),
  listCustomers: (orgId: string, q: AdminListQuery) =>
    withTenant(orgId, async () => (await getAdmin()).listCustomers(toAdminListParams(q))),
  getCustomer: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getCustomer(id)),
  getStoreSettings: (orgId: string) =>
    withTenant(orgId, async () => (await getAdmin()).getStoreSettings()),
  updateStoreSettings: (orgId: string, input: UpdateStoreInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateStoreSettings(input)),
  updateInventory: (orgId: string, input: UpdateInventoryInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateInventory(input)),
  dashboardStats: (orgId: string) =>
    withTenant(orgId, async () => (await getAdmin()).getDashboardStats()),
}
