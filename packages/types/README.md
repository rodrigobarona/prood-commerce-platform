# @prood/types

Unified Data Model for eCommerce — 20+ domain types that work across every platform.

[![npm](https://img.shields.io/npm/v/@prood/types?color=CB3837)](https://www.npmjs.com/package/@prood/types)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@prood/types` is the shared type foundation for the entire Prood ecosystem. It defines a platform-agnostic data model that adapters map to, so your application code works identically regardless of the underlying eCommerce backend.

## Install

```bash
npm install @prood/types
```

## What's Included

### Domain Types

| Domain | Types |
|--------|-------|
| **Product** | `Product`, `ProductVariant`, `Attribute` |
| **Cart** | `Cart`, `CartItem`, `CartTotals` |
| **Order** | `Order`, `OrderItem`, `OrderStatus`, `FulfillmentStatus` |
| **Customer** | `Customer`, `Address`, `RegisterInput` |
| **Category** | `Category` |
| **Brand** | `Brand` |
| **Shipping** | `ShippingMethod`, `ShippingProvider` |
| **Payment** | `PaymentMethod`, `PaymentProvider`, `PaymentSession` |
| **Search** | `SearchParams`, `SearchResult`, `Facet` |
| **Wishlist** | `Wishlist`, `WishlistItem` |
| **Review** | `Review`, `ReviewInput`, `ReviewSummary` |
| **Promotion** | `Promotion`, `Coupon`, `DiscountType` |
| **Return** | `ReturnRequest`, `ReturnItem`, `ReturnReason` |
| **Store** | `StoreInfo`, `Country` |

### Adapter Interface

The `CommerceAdapter` interface defines the contract that every platform adapter must implement:

```typescript
import type { CommerceAdapter, Product, Cart } from '@prood/types'

// Every adapter implements this interface
const adapter: CommerceAdapter = createSallaAdapter({ ... })

// Same API regardless of platform
const products: Product[] = await adapter.getProducts({ limit: 10 })
const cart: Cart = await adapter.getCart(cartId)
```

### Utility Types

- `Maybe<T>` — nullable type wrapper
- `LocalizedString` — i18n-ready string type
- `PaginatedResult<T>` — standardized pagination
- `Price` / `DiscountablePrice` — monetary values
- `CommerceError` — typed error class with error codes

### Orchestrator Types

Types for multi-adapter composition:

- `AdapterDomain` — union of all domain names (`catalog`, `cart`, `checkout`, etc.)
- `CommerceOrchestrator` — orchestrator interface with capability checking
- `CompositeOrchestratorConfig` — source mapping for multi-adapter setups

### Provider Interfaces

| Interface | Purpose |
|---|---|
| `PaymentProvider` | Payment session lifecycle (create, get, refund) |
| `NotificationProvider` | Multi-channel notification delivery (email, SMS, push) |
| `AnalyticsProvider` | Event tracking, user identification, page views |
| `TaxProvider` | Tax calculation for line items |

## Documentation

Full docs at [prood.dev](https://prood.dev)

## License

[MIT](../../LICENSE)
