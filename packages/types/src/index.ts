// ---------------------------------------------------------------------------
// @prood/types — Unified Data Model for eCommerce
// ---------------------------------------------------------------------------
// Barrel export — re-exports all domain types

// Common primitives & utilities
export type { Maybe, Id, LocalizedField, LocalizedString, PaginatedResult, PaginationParams, Price, DiscountablePrice, Image, DeepPartial, CommerceErrorCode, TaxStrategy } from './common.js'
export { DEFAULT_LOCALE, DEFAULT_LOCALES, LOCALE_META } from './locale.js'
export type { SupportedLocale } from './locale.js'
export { CommerceError, isCommerceError } from './common.js'
export type { CommerceErrorBody, CommerceErrorResponse } from './http-errors.js'
export { toErrorResponse } from './http-errors.js'

// Product
export type { Product, ProductVariant, Attribute, ProductType } from './product.js'
export { canQuickAdd, firstAvailableVariant, variantPrice } from './variant.js'

// Category
export type { Category } from './category.js'

// Brand
export type { Brand } from './brand.js'

// Cart
export type { Cart, CartItem, CartTotals } from './cart.js'

// Customer
export type { Customer, Address, CheckoutAddress, RegisterInput, UpdateCustomerInput } from './customer.js'

// Order
export type { Order, OrderItem, OrderPaymentDetails, OrderStatus, PaymentStatus, OrderFulfillmentStatus, FulfillmentStatus } from './order.js'

// Order Input (for OrderAdapter.createOrder)
export type { CreateOrderInput, OrderItemInput } from './order-input.js'

// Order Status & History (for OrderAdapter status/timeline methods)
export type { OrderStatusInfo, OrderHistoryEntry, UpdateOrderStatusInput, PaymentEventInput, PaymentEventResult, RecordOrderPaymentInput } from './order-status.js'

// Shipping
export type { ShippingMethod, ShippingProvider, FulfillmentType } from './shipping.js'

// Payment
export type { PaymentMethod, PaymentType, Installment } from './payment.js'

// Payment Provider (pluggable gateway interface)
export type {
  CredentialCheck,
  PaymentMethodKind,
  PaymentProvider,
  PaymentSession,
  PaymentSessionStatus,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from './payment-provider.js'

// Search
export type { SearchParams, SearchResult, Facet, FacetValue, SortOption, SortDirection } from './search.js'

// Wishlist
export type { Wishlist, WishlistItem } from './wishlist.js'

// Review
export type { Review, ReviewInput, ReviewSummary } from './review.js'

// Store
export type { StoreInfo, StoreCurrency, StoreLocale } from './store.js'

// Country
export type { Country } from './country.js'

// Promotion
export type { Promotion, Coupon, DiscountType, PromotionTarget, PromotionCondition } from './promotion.js'

// Return
export type { ReturnRequest, ReturnItem, CreateReturnInput, ReturnReason, ReturnStatus, RefundMethod } from './return.js'

// Adapter contract (sub-interfaces + composed)
export type {
  CommerceAdapter,
  CommerceOrchestrator,
  UniversalDomains,
  CommonDomains,
  SpecializedDomains,
  DomainMap,
  OrchestratorDomain,
  CatalogAdapter,
  CartAdapter,
  CheckoutAdapter,
  CustomerAdapter,
  OrderAdapter,
  WishlistAdapter,
  ReviewAdapter,
  StoreAdapter,
  PromotionAdapter,
  ReturnAdapter,
  BrandAdapter,
  CountryAdapter,
  GetProductParams,
  GetCategoriesParams,
  AddToCartInput,
  AddressInput,
  CustomerOrdersParams,
  AdapterDomain,
} from './adapter.js'

// Notification Provider
export type {
  NotificationProvider,
  NotificationChannel,
  NotificationMessage,
  NotificationResult,
  NotificationRule,
} from './notification.js'

// Analytics Provider
export type { AnalyticsProvider } from './analytics.js'

// Tax Provider
export type {
  TaxProvider,
  TaxCalculationInput,
  TaxLineItem,
  TaxResult,
  TaxLineItemResult,
} from './tax.js'

// Storage Provider (pluggable object storage for native platform)
export type {
  StorageProvider,
  StorageUploadResult,
  UploadInput,
  PresignedUrlOptions,
  PresignedUrlResult,
} from './storage-provider.js'

// Security helpers
export { safeEqual } from './security.js'

// Order payment state
export { MBWAY_WINDOW_MS, PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE, SETTLED_PAYMENTS, orderOutcome, orderPaymentState, toPortugueseMobile, type OrderOutcome, type OrderPaymentState } from './order-payment.js'
export { safeRedirectPath } from './redirect.js'
export { requiredEnv, storeOriginForSlug } from './env.js'
