# Prood Commerce Platform — Complete Documentation

> Comprehensive technical and product documentation of the Prood Commerce
> Platform. Covers all 7 applications, 15+ shared packages, data model,
> architecture decisions, integrations, subscription plans, security posture,
> and planned capabilities. Intended as a reference for client proposals.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Architecture](#platform-architecture)
3. [Applications](#applications)
   - [Storefront](#1-storefront--tenant-storefront)
   - [Dashboard](#2-dashboard--merchant-dashboard)
   - [Commerce API](#3-api--commerce-api)
   - [Hosted Checkout](#4-checkout--hosted-checkout)
   - [Marketing Site](#5-web--marketing-site)
   - [Documentation](#6-docs--documentation-site)
   - [Super-Admin](#7-admin--platform-super-admin)
4. [Shared Packages](#shared-packages)
   - [Core Engine](#core-engine)
   - [Checkout Stack](#checkout-stack)
   - [Providers](#providers)
   - [Consumer Surfaces](#consumer-surfaces)
5. [Data Model](#data-model)
6. [Multi-Tenancy](#multi-tenancy)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [Payment Processing](#payment-processing)
9. [Checkout Flow](#checkout-flow)
10. [Order Lifecycle](#order-lifecycle)
11. [Subscription Plans and Billing](#subscription-plans-and-billing)
12. [Security Posture](#security-posture)
13. [AI and Agent Integration](#ai-and-agent-integration)
14. [Email and Notifications](#email-and-notifications)
15. [Storage](#storage)
16. [Documentation and LLM Access](#documentation-and-llm-access)
17. [Deployment](#deployment)
18. [Developer Experience](#developer-experience)
19. [Planned Capabilities](#planned-capabilities)
    - [Content Engine](#content-engine)
    - [Event-First Platform](#event-first-platform)
    - [Content Rendering Engine](#content-rendering-engine)
20. [Current Production Status](#current-production-status)
21. [Technology Stack Summary](#technology-stack-summary)

---

## Executive Summary

Prood is a **white-label, multi-tenant, API-first commerce platform** built on
modern infrastructure: **Next.js 16 / React 19**, **Neon Postgres + Drizzle
ORM**, **Better Auth**, **Upstash Redis**, and **Vercel**. It enables merchants
and agencies to launch fully isolated e-commerce stores with custom domains,
per-tenant payment credentials, and a complete merchant dashboard — all from a
single deployment.

The platform is structured as a **pnpm + Turborepo monorepo** with **7 deployed
applications** and **15+ shared packages**, designed with enterprise-grade tenant
isolation (Postgres Row-Level Security), pluggable payment providers, and an
emerging AI/agent integration layer (MCP Protocol + Agent Auth).

### What Prood Offers

- **For Merchants:** Launch an online store in minutes — manage products,
  orders, customers, and payments from a single dashboard. Get a free
  `{store}.prood.app` subdomain or connect a custom domain.

- **For Agencies:** Manage multiple client stores from one account. Each store
  is fully isolated with its own domain, payment credentials, team, and data.
  The Agency plan supports 10+ stores with dedicated support.

- **For Developers:** A complete API (`/v1`) with OpenAPI 3.1 spec, MCP server
  for AI agents, typed TypeScript client, CLI, and LLM-readable documentation.
  Build integrations, automate workflows, or connect AI agents.

---

## Platform Architecture

The platform follows a layered architecture with clear separation of concerns:

```
Public-Facing                    Merchant Tools               Platform Core
─────────────────                ──────────────               ─────────────
prood.com (Marketing)            dashboard.prood.com          api.prood.com
*.prood.app (Storefronts)        checkout.prood.com           admin.prood.com
docs.prood.com (Docs)

                                      │
                           ┌──────────┼──────────┐
                           │     apps/api        │
                           │  Commerce API +     │
                           │  Auth + MCP         │
                           └──────────┬──────────┘
                                      │
                    ┌─────────────────┼────────────────────┐
                    │                 │                     │
             @prood/commerce    @prood/auth          @prood/billing
             (Server Facade)    (Better Auth)        (Plan Limits)
                    │
             @prood/platform
             (Neon + Drizzle + RLS)
                    │
              Neon Postgres
```

### Design Principles

- **Single commerce engine:** `@prood/platform` backed by Neon Postgres +
  Drizzle is the only runtime engine. No external commerce SaaS dependency.

- **Tenant isolation:** Every commerce record is scoped by a Better Auth
  organization ID, enforced through three layers: Postgres RLS (forced,
  fail-closed), transaction-scoped session variables (`withTenant`), and
  application-level WHERE clauses.

- **API-centric:** Storefront and dashboard consume `apps/api` via
  `@prood/api-client`. No direct commerce database access from frontend apps.

- **Pluggable providers:** Payment (Stripe, Easypay, Ifthenpay), storage
  (Vercel Blob, S3), and notification (Resend) providers are swappable per a
  shared TypeScript interface defined in `@prood/types`.

- **Encrypted tenant credentials:** Per-merchant payment keys are stored with
  AES-256-GCM encryption in the database and decrypted only at runtime.

---

## Applications

Prood consists of 7 independently deployed Next.js applications sharing a
single Neon Postgres database.

| App            | Port  | Production URL                | Role                          |
| -------------- | ----- | ----------------------------- | ----------------------------- |
| `storefront`   | :3000 | `https://{slug}.prood.app`    | Tenant storefront             |
| `web`          | :3001 | `https://prood.com`           | Marketing site                |
| `dashboard`    | :3002 | `https://dashboard.prood.com` | Merchant dashboard            |
| `docs`         | :3003 | `https://docs.prood.com`      | Documentation                 |
| `checkout`     | :3004 | `https://checkout.prood.com`  | Hosted checkout               |
| `api`          | :3005 | `https://api.prood.com`       | Commerce API, auth, MCP       |
| `admin`        | :3006 | `https://admin.prood.com`     | Platform super-admin          |

---

### 1. Storefront — Tenant Storefront

**Location:** `apps/storefront`
**Production URL:** `https://{slug}.prood.app` or custom domain (e.g.
`https://shop.client.com`)

Multi-tenant customer-facing e-commerce UI. Resolves merchant identity from the
request host (subdomain or verified custom domain), then renders catalog, cart,
multi-step checkout, and customer account pages.

#### Pages and Routes

| Route                  | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `/`                    | Home — hero banner, category grid (6), featured products (8)  |
| `/products`            | Product listing with search, filters, sort, pagination        |
| `/products/[slug]`     | Product detail — gallery, price, ratings, variants, add-to-cart |
| `/categories/[slug]`   | Category browsing with recursive slug lookup                  |
| `/cart`                | Full cart with coupon input, save-for-later, mobile CTA       |
| `/checkout`            | 4-step wizard: Contact, Address, Shipping, Review             |
| `/order-confirmation`  | Post-payment summary + guest account creation                 |
| `/account`             | Account dashboard with 5 most recent orders                   |
| `/account/orders`      | Full order history (50 orders)                                |
| `/login`               | Sign-in with redirect support                                 |
| `/register`            | Create customer account                                       |
| `/forgot-password`     | Password reset request                                        |
| `/reset-password`      | Set new password with token from email                        |

#### Route Groups

- `(store)` — Main shop chrome with `Header`, `Footer`, `TenantGuard`
- `(checkout)` — Minimal checkout layout with `CheckoutHeader`, `CheckoutFooter`

#### BFF API Routes

| Route                                  | Methods     | Purpose                          |
| -------------------------------------- | ----------- | -------------------------------- |
| `/api/auth/[...all]`                   | GET, POST   | Better Auth customer handler     |
| `/api/commerce/cart`                   | GET, POST   | Get/create cart (cookie-based)   |
| `/api/commerce/cart/items`             | POST        | Add item; auto-create cart       |
| `/api/commerce/cart/items/[itemId]`    | PUT, DELETE | Update quantity / remove item    |
| `/api/commerce/cart/coupon`            | POST, DELETE| Apply / remove coupon            |
| `/api/commerce/cart/shipping-methods`  | GET         | Shipping options for cart        |
| `/api/commerce/search`                 | GET         | Product search (max 8 results)   |
| `/api/commerce/countries`              | GET         | Supported countries              |

#### Key Capabilities

- **Host-based multi-tenancy** — Custom domains (verified in `tenant_domain`
  table) and platform subdomains (`{slug}.prood.app`)
- **Customer authentication** — Better Auth email/password per store origin,
  with auto-linking of guest customers on registration
- **Cart persistence** — httpOnly `commerce_cart_id` cookie (30-day expiry)
- **4-step checkout** — Contact info, shipping address (Geoapify autocomplete),
  shipping method selection, order review
- **Express checkout** — Apple Pay / Google Pay buttons trigger `startCheckout()`
  directly
- **Commerce data** — All product/order data fetched via `@prood/api-client`
  against `apps/api`, not direct DB access
- **Payment handoff** — Orders placed through API, payment session created at
  hosted `apps/checkout`, customer redirected for payment

#### Tenant Resolution Flow

1. Read `Host` header from request
2. Check `tenant_domain` table for verified custom domain match
3. If `{slug}.{PLATFORM_DOMAIN}`, look up `organization.slug`
4. Reserved slugs blocked: `www`, `api`, `dashboard`, `pay`, `docs`
5. Fallback to `DEFAULT_TENANT_ORG_ID` for local development
6. Unresolved host in production returns 404 (fail-closed)

#### Technology

Next.js 16, React 19, `@prood/ui` (shadcn/Radix), `react-hook-form` + Zod,
`@geoapify/geocoder-autocomplete`, `next-themes`, Sonner toasts, Phosphor icons

---

### 2. Dashboard — Merchant Dashboard

**Location:** `apps/dashboard`
**Production URL:** `https://dashboard.prood.com`

Full merchant administration panel. Store owners sign in, create/select
organizations (stores), and manage every aspect of their commerce operations.

#### Pages and Routes

| Route                            | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `/`                              | Overview — revenue, order/customer/product counts, recent orders |
| `/products`                      | Paginated product table (50 per page)                            |
| `/products/new`                  | Create product form                                              |
| `/products/[id]/edit`            | Edit product + delete                                            |
| `/orders`                        | Order list with status badges                                    |
| `/orders/[id]`                   | Order detail: items, totals, customer, addresses, timeline       |
| `/customers`                     | Customer directory                                               |
| `/customers/[id]`               | Customer detail with saved addresses                             |
| `/domains`                       | Platform subdomain + custom domain management with DNS           |
| `/integrations`                  | Payment provider grid by type                                    |
| `/integrations/[provider]`       | Provider configuration form                                      |
| `/team`                          | Invite, members, pending invitations with seat limits            |
| `/account`                       | Profile (name, avatar) and password management                   |
| `/settings`                      | Store settings (localized name/description, address, currency)   |
| `/settings/api-keys`             | Create, list, revoke organization-scoped API keys                |
| `/billing`                       | Plan name and entitlements summary                               |
| `/analytics`                     | Placeholder — coming soon                                        |
| `/login`                         | Email/password sign-in                                           |
| `/register`                      | Account + first store creation                                   |
| `/device/capabilities`           | Agent capability approval UI                                     |

#### Server Actions (17 total)

| Module          | Actions                                                       |
| --------------- | ------------------------------------------------------------- |
| Products        | `createProductAction`, `updateProductAction`, `deleteProductAction` |
| Orders          | `fulfillOrderAction`, `refundOrderAction`, `cancelOrderAction` |
| Settings        | `updateStoreSettingsAction`                                   |
| API Keys        | `createApiKeyAction`, `revokeApiKeyAction`                    |
| Domains         | `addDomainAction`, `verifyDomainAction`, `removeDomainAction` |
| Integrations    | `saveIntegrationAction`, `disconnectIntegrationAction`        |
| Team            | `assertTeamSeatAvailableAction`                               |
| Agent Approval  | `approveCapabilityRequest`, `denyCapabilityRequest`           |

#### Key Capabilities

- **Multi-store support** — Organization switcher for merchants managing
  multiple stores; each org is fully isolated
- **Auth via Better Auth** — Organizations with roles (owner, admin, member);
  BFF proxy to `apps/api` for session forwarding
- **Custom domain provisioning** — Add domains via Vercel SDK, automatic DNS
  verification, recorded in `tenant_domain` table
- **Encrypted payment credentials** — Per-provider credential forms; secrets
  encrypted with AES-256-GCM before storage
- **Team management** — Invite by email, assign roles, plan-enforced seat limits
- **Localized content** — Product names and descriptions in English, Portuguese,
  and Spanish
- **Product types** — Physical, digital, service, event
- **Order lifecycle** — Fulfill (with tracking), refund, cancel; automated email
  notifications

#### Data Flow

```
Merchant browser
  → proxy.ts (cookie gate, public path allowlist)
  → (dashboard)/layout.tsx (DB session + org list)
  → Page (RSC fetches via admin-api / domains / integrations / auth DB)
  → Server actions (mutations + revalidatePath)
  → apps/api (commerce + auth)
  → Neon Postgres (shared auth + dashboard-only tables)
  → Vercel API (custom domains on storefront project)
```

---

### 3. API — Commerce API

**Location:** `apps/api`
**Production URL:** `https://api.prood.com`

Central API contract boundary. REST `/v1` endpoints, live OpenAPI 3.1 spec, MCP
server for AI agents, Better Auth issuer, and Agent Auth discovery. All commerce
operations across the platform flow through this app.

#### REST Endpoints

##### Meta / Health

| Method | Path                | Auth   | Description                              |
| ------ | ------------------- | ------ | ---------------------------------------- |
| GET    | `/v1/health`        | None   | Liveness check                           |
| GET    | `/v1/me`            | Any    | Echo resolved caller info                |
| GET    | `/v1/openapi.json`  | None   | Live OpenAPI 3.1 JSON document           |

##### Storefront — Catalog

| Method | Path                | Auth        | Description                    |
| ------ | ------------------- | ----------- | ------------------------------ |
| GET    | `/v1/products`      | storefront  | Search/list products           |
| GET    | `/v1/products/:id`  | storefront  | Get product by ID              |
| GET    | `/v1/categories`    | storefront  | List categories (tree support) |
| GET    | `/v1/store`         | storefront  | Store metadata                 |
| GET    | `/v1/countries`     | storefront  | Supported countries            |

##### Storefront — Carts and Checkout

| Method | Path                                    | Auth        | Description              |
| ------ | --------------------------------------- | ----------- | ------------------------ |
| POST   | `/v1/carts`                             | storefront  | Create cart              |
| GET    | `/v1/carts/:id`                         | storefront  | Get cart                 |
| POST   | `/v1/carts/:id/items`                   | storefront  | Add line item            |
| PATCH  | `/v1/carts/:id/items/:itemId`           | storefront  | Update item quantity     |
| DELETE | `/v1/carts/:id/items/:itemId`           | storefront  | Remove line item         |
| POST   | `/v1/carts/:id/coupon`                  | storefront  | Apply coupon code        |
| DELETE | `/v1/carts/:id/coupon`                  | storefront  | Remove coupon            |
| GET    | `/v1/carts/:id/shipping-methods`        | storefront  | Available shipping       |
| GET    | `/v1/carts/:id/payment-methods`         | storefront  | Available payment        |
| PUT    | `/v1/carts/:id/shipping-address`        | storefront  | Set shipping address     |
| PUT    | `/v1/carts/:id/billing-address`         | storefront  | Set billing address      |
| PATCH  | `/v1/carts/:id/shipping-method`         | storefront  | Select shipping method   |
| POST   | `/v1/carts/:id/place-order`             | storefront  | Place order from cart    |

##### Storefront — Orders

| Method | Path                | Auth              | Description               |
| ------ | ------------------- | ----------------- | ------------------------- |
| GET    | `/v1/orders`        | storefront+session| List customer orders      |
| GET    | `/v1/orders/:id`    | storefront        | Get order by ID           |

##### Admin — Products

| Method | Path                         | Auth  | Description         |
| ------ | ---------------------------- | ----- | ------------------- |
| GET    | `/v1/admin/products`         | admin | List products       |
| POST   | `/v1/admin/products`         | admin | Create product      |
| GET    | `/v1/admin/products/:id`     | admin | Get product         |
| PATCH  | `/v1/admin/products/:id`     | admin | Update product      |
| DELETE | `/v1/admin/products/:id`     | admin | Delete product      |

##### Admin — Categories

| Method | Path                           | Auth  | Description         |
| ------ | ------------------------------ | ----- | ------------------- |
| POST   | `/v1/admin/categories`         | admin | Create category     |
| PATCH  | `/v1/admin/categories/:id`     | admin | Update category     |
| DELETE | `/v1/admin/categories/:id`     | admin | Delete category     |

##### Admin — Orders

| Method | Path                                  | Auth  | Description          |
| ------ | ------------------------------------- | ----- | -------------------- |
| GET    | `/v1/admin/orders`                    | admin | List orders          |
| GET    | `/v1/admin/orders/:id`                | admin | Get order            |
| POST   | `/v1/admin/orders/:id/cancel`         | admin | Cancel order         |
| GET    | `/v1/admin/orders/:id/history`        | admin | Order status history |
| POST   | `/v1/admin/orders/:id/fulfill`        | admin | Fulfill + tracking   |
| POST   | `/v1/admin/orders/:id/refund`         | admin | Refund order         |

##### Admin — Customers, Store, Inventory, Dashboard

| Method | Path                          | Auth  | Description             |
| ------ | ----------------------------- | ----- | ----------------------- |
| GET    | `/v1/admin/customers`         | admin | List customers          |
| GET    | `/v1/admin/customers/:id`     | admin | Get customer            |
| GET    | `/v1/admin/store`             | admin | Store settings          |
| PATCH  | `/v1/admin/store`             | admin | Update store settings   |
| POST   | `/v1/admin/inventory`         | admin | Update inventory levels |
| GET    | `/v1/admin/dashboard`         | admin | Dashboard stats         |

##### Webhooks

| Method   | Path                                    | Auth             | Description               |
| -------- | --------------------------------------- | ---------------- | ------------------------- |
| POST/GET | `/v1/webhooks/payments/:provider`       | checkout-secret  | Payment webhook           |

#### Authentication Methods (priority order)

1. **Bearer JWT** — Better Auth Agent Auth session (Grow+ plan required)
2. **x-api-key** — Organization-scoped API key with metadata
3. **Session cookie** — Better Auth dashboard session (admin + storefront scope)
4. **x-storefront-host** — Tenant resolution for storefront calls
5. **DEFAULT_TENANT_ORG_ID** — Dev/preview fallback

#### MCP Server (38 tools)

Accessible at `/mcp` via streamable HTTP transport. Uses the same auth methods
as REST. 20 storefront-scope tools (catalog, cart CRUD, checkout, orders) and
18 admin-scope tools (full CRUD + dashboard stats).

#### Agent Auth

- Discovery endpoint: `/.well-known/agent-configuration`
- Capabilities auto-generated from OpenAPI `operationId` values
- Device approval flow with dashboard integration at `/device/capabilities`
- Requires Grow+ plan (`agentAuthEnabled` entitlement)

#### Non-REST Entry Points

| Path                                   | Purpose                          |
| -------------------------------------- | -------------------------------- |
| `/`                                    | API index (version, links)       |
| `/api/auth/*`                          | Better Auth handler + CORS       |
| `/.well-known/agent-configuration`     | Agent Auth Protocol discovery    |
| `/mcp`                                 | MCP streamable HTTP transport    |
| `/v1/openapi.json`                     | Live OpenAPI 3.1 document        |

---

### 4. Checkout — Hosted Checkout

**Location:** `apps/checkout`
**Production URL:** `https://checkout.prood.com`

Standalone, hosted payment surface. Customers are redirected here from
storefronts to complete payment. Sessions are stored in Upstash Redis with a
24-hour TTL.

#### Pages

| Route              | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `/`                | Placeholder (customers are redirected to `/c/*`)  |
| `/c/[id]`          | Primary payment UI — adapts to payment provider  |
| `/confirm/[id]`    | Post-Stripe-redirect confirmation + store redirect|
| `/success/[id]`    | Static success page                              |

#### API Routes

| Method | Path                               | Auth              | Purpose                      |
| ------ | ---------------------------------- | ----------------- | ---------------------------- |
| POST   | `/api/sessions`                    | checkout-secret   | Create checkout session      |
| GET    | `/api/sessions/[id]`               | Public            | Load session for UI          |
| POST   | `/api/sessions/[id]/pay`           | Public            | Submit payment               |
| POST   | `/api/sessions/[id]/confirm`       | Public            | Confirm after 3DS redirect   |
| POST   | `/api/payment-links`               | checkout-secret   | Create expiring payment link |
| POST/GET | `/api/webhooks/[provider]/[org]` | Provider-specific | Forward webhooks to API      |

#### Payment Flow

1. Storefront calls `POST /api/sessions` with order details and tenant ID
2. Session snapshot stored in Redis (key: `checkout:session:{sessionId}`)
3. Customer visits `/c/{sessionId}` — UI loads session and renders provider UI
4. **Stripe:** Payment Element → `checkout.confirm()` → `/confirm/{id}` redirect
5. **Easypay/Ifthenpay (Multibanco):** Reference display (entity + reference);
   async confirmation via webhook
6. **Redirect methods (CC):** Immediate redirect to provider page
7. Webhook hits `/api/webhooks/{provider}/{org}` → forwarded to Commerce API
8. Customer redirected to store's `returnUrl` (order confirmation page)

#### Session Management

- **Storage:** Upstash Redis via `@prood/checkout-host`
- **Key format:** `checkout:session:{sessionId}`
- **Session IDs:** `cs_*` (checkout session) or `pl_*` (payment link)
- **TTL:** 24 hours default; payment links default to 30 minutes
- **State machine:** `idle → info → payment → confirming → complete | failed`

---

### 5. Web — Marketing Site

**Location:** `apps/web`
**Production URL:** `https://prood.com`

Public marketing and landing site. Explains the product, pricing, integrations,
agency workflow, and AI capabilities. Drives sign-ups to
`dashboard.prood.com/register`.

#### Pages

| Route            | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `/`              | Home — full marketing funnel (11 sections)    |
| `/pricing`       | Plans, comparison table, FAQ, trust points    |
| `/ai`            | AI, MCP, Agent Auth capabilities              |
| `/agencies`      | Agency workflow + Agency plan card             |
| `/integrations`  | Payment provider details                      |
| `/terms`         | Terms summary (pre-GA placeholder)            |
| `/privacy`       | Privacy summary (pre-GA placeholder)          |

#### Home Page Sections

1. Hero with CTAs and orders table mock
2. Value strip (margin, keys, subdomain)
3. How it works (3 steps with mocks)
4. Product showcase (storefront + dashboard split)
5. Merchant pain vs. gain comparison
6. Three pillars
7. Agents section (compact)
8. Integrations section (compact)
9. Stats callouts
10. Pricing preview (Free + Grow + Scale cards)
11. Agencies teaser + CTA

#### Mock UIs

The marketing site includes 8 interactive mock components depicting the
platform's key features: dashboard orders, storefront catalog, checkout,
domains, integrations, agent auth, and multi-store management.

#### SEO

- Dynamic OG image generation
- `sitemap.xml` with 7 routes
- `robots.txt` allowing all crawlers

---

### 6. Docs — Documentation Site

**Location:** `apps/docs`
**Production URL:** `https://docs.prood.com`

Fumadocs-powered documentation with 59 MDX pages, interactive OpenAPI reference,
full-text search (Orama), dynamic OG images, and LLM-readable exports.

#### Content Structure (59 pages)

| Category          | Pages | Topics                                                    |
| ----------------- | ----- | --------------------------------------------------------- |
| Getting Started   | 4     | Installation, Quick Start, Environment Variables          |
| Architecture      | 7     | Overview, Multi-Tenant, Privacy, Checkout Flow, Order Lifecycle, Unified Types, API-Centric |
| Billing           | 1     | Plans and Entitlements                                    |
| Applications      | 20    | Storefront (4), Dashboard (5), Checkout (4), API (5)      |
| Packages          | 15    | Platform, Commerce, Checkout (2), Payments (4), Storage (3), Types, UI, API Client |
| Guides            | 8     | Merchants, Agencies, Machine Access, Onboarding, Deployment, Payment Integration, Webhooks |
| API Reference     | Auto  | Generated from OpenAPI spec via Fumadocs OpenAPI          |

#### LLM-Readable Routes

| Route                                    | Output                            |
| ---------------------------------------- | --------------------------------- |
| `/llms.txt`                              | Index of all doc pages            |
| `/llms-full.txt`                         | Concatenated full text            |
| `/llms.mdx/docs/[slug]/content.md`       | Per-page markdown                 |

#### OpenAPI Sync

`apps/docs/scripts/sync-openapi.ts` imports `buildOpenApiDocument()` from
`apps/api/lib/openapi`, writes a snapshot to `openapi/commerce.json`, and
renders interactive API pages at `/docs/api/*`. CI can run `--check` mode to
detect drift.

---

### 7. Admin — Platform Super-Admin

**Location:** `apps/admin`
**Production URL:** `https://admin.prood.com`

Restricted operations console for platform operators. Provides cross-tenant
visibility via direct Neon DB queries (Drizzle). Not merchant-facing.

#### Pages

| Route                 | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `/`                   | Dashboard — KPIs, daily signups chart, plans, provider distribution |
| `/users`              | All users table — name, email, role, status        |
| `/users/[id]`         | User detail — orgs, sessions, ban/role/revoke      |
| `/organizations`      | All tenant organizations (stores)                  |
| `/organizations/[id]` | Org detail — plan, members, domains                |
| `/sessions`           | All active sessions                                |
| `/domains`            | Platform-wide custom domain registry               |
| `/api-keys`           | Read-only API key overview                         |
| `/agents`             | Agent Auth registrations + deactivate              |
| `/settings`           | Environment variable status (presence, not values) |
| `/login`              | Email/password sign-in                             |

#### Admin Actions

- **Set user role** (user / admin)
- **Ban / unban users** with reason
- **Revoke sessions** (individual or all for a user)
- **Deactivate agents** (Agent Auth registrations)

#### Authorization

- Gated by `role === "admin"` in the database session
- `ADMIN_USER_IDS` environment variable on `apps/api` auto-promotes specified
  Better Auth user IDs to admin role
- Session validated via direct DB read (bypasses Better Auth origin checks)
- Non-admin users who authenticate see an "Access Denied" card

---

## Shared Packages

### Core Engine

#### `@prood/types` — Unified Domain Model

**Location:** `packages/types`

30+ TypeScript contracts shared across the entire platform. Defines products,
carts, orders, customers, adapters, and all provider interfaces.

| Module                 | Domain                                        |
| ---------------------- | --------------------------------------------- |
| `product.ts`           | Product, ProductImage, ProductVariant, ProductOption |
| `category.ts`          | Category (tree with parent)                   |
| `cart.ts`              | Cart, CartItem                                |
| `order.ts`             | Order, OrderItem, OrderHistory                |
| `order-status.ts`      | Three-dimensional status enums                |
| `customer.ts`          | Customer, CustomerAddress                     |
| `shipping.ts`          | ShippingMethod, ShippingRate                  |
| `payment.ts`           | PaymentMethod, PaymentSession                 |
| `payment-provider.ts`  | PaymentProvider interface                     |
| `storage-provider.ts`  | StorageProvider interface                     |
| `notification.ts`      | NotificationProvider interface                |
| `adapter.ts`           | CommerceAdapter + segregated sub-adapters     |
| `promotion.ts`         | Promotion, Coupon                             |
| `review.ts`            | Review, ReviewSummary                         |
| `wishlist.ts`          | Wishlist, WishlistItem                        |
| `return.ts`            | Return, ReturnItem                            |
| `store.ts`             | StoreInfo                                     |
| `brand.ts`             | Brand                                         |
| `country.ts`           | Country                                       |
| `search.ts`            | SearchResult                                  |
| `locale.ts`            | LocalizedField, SupportedLocale               |
| `common.ts`            | Pagination, SortOptions                       |
| `http-errors.ts`       | CommerceError, error codes, toErrorResponse   |

Also includes type stubs for future features: wholesale, auctions, rentals,
gift cards, locations, analytics, tax, and delivery providers.

---

#### `@prood/platform` — Commerce Engine

**Location:** `packages/platform`

The native Prood commerce engine: multi-tenant Postgres on Neon, Drizzle ORM,
and row-level security. Implements the `CommerceAdapter` interface from
`@prood/types` plus a merchant Admin API.

##### Database Schema (27 tenant-scoped tables + countries)

**Catalog tables:**
- `products` — pricing, status, product_type, inventory, VAT, slug
- `product_images` — ordered images per product
- `product_variants` — SKU-level size/color variants
- `product_options` — option groups (Size, Color)
- `product_option_values` — individual option values (S, M, L)
- `product_attributes` — key-value metadata
- `product_tags` — freeform tags
- `product_categories` — many-to-many junction
- `categories` — tree via `parent_id`, localized names
- `brands` — brand entities

**Commerce tables:**
- `customers` — commerce UUID, `auth_user_id` link, email
- `customer_addresses` — shipping/billing addresses
- `carts` — coupon, addresses (JSONB), shipping/payment method
- `cart_items` — product, variant, quantity
- `orders` — three-dimensional status, totals, address snapshots, tracking
- `order_items` — line item snapshots
- `order_history` — status transition log

**Engagement tables:**
- `wishlists` — one per customer
- `wishlist_items` — product references
- `reviews` — product reviews with status
- `promotions` — discount type, target, conditions
- `coupons` — code-based, linked to promotions
- `returns` — order-linked returns
- `return_items` — individual return line items

**Store tables:**
- `store_info` — per-tenant store metadata (composite PK with org)
- `integrations` — provider config (composite PK with org)
- `countries` — shared reference data (no tenant scope)

##### Domain Modules

| Module       | Functions                                                  |
| ------------ | ---------------------------------------------------------- |
| Catalog      | `getProduct`, `getProducts`, `getCategories`               |
| Cart         | `createCart`, `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `applyCoupon`, `removeCoupon` |
| Checkout     | `getShippingMethods`, `setShippingAddress`, `setBillingAddress`, `setShippingMethod`, `getPaymentMethods`, `placeOrder` |
| Orders       | `createOrder`, `getOrder`, `getCustomerOrders`, `updateOrderStatus`, `cancelOrder`, `getOrderHistory` |
| Customers    | `getCustomer`, `updateCustomer`, `getAddresses`, `addAddress`, `updateAddress`, `deleteAddress` |
| Store        | `getStoreInfo` (auto-provisions default)                   |
| Brands       | `getBrands`                                                |
| Countries    | `getCountries`                                             |
| Wishlist     | `getWishlist`, `addToWishlist`, `removeFromWishlist`       |
| Reviews      | `getProductReviews`, `getReviewSummary`, `submitReview`    |
| Promotions   | `getActivePromotions`, `validateCoupon`                    |
| Returns      | `createReturn`, `getReturn`, `getReturns`, `cancelReturn`  |

##### Admin API

| Area        | Methods                                                    |
| ----------- | ---------------------------------------------------------- |
| Products    | `listProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct` |
| Categories  | `createCategory`, `updateCategory`, `deleteCategory`       |
| Orders      | `listOrders`, `getOrder`, `fulfillOrder`, `refundOrder`    |
| Customers   | `listCustomers`, `getCustomer`, `deleteCustomer`           |
| Store       | `getStoreSettings`, `updateStoreSettings`                  |
| Inventory   | `updateInventory` (set/increment/decrement), `getLowStockProducts` |
| Dashboard   | `getDashboardStats` (revenue, counts, recent orders)       |

##### Customer Identity

- `ensureCustomerForAuthUser` — links Better Auth user to commerce customer
- `ensureGuestCustomer` — creates guest customer from checkout info
- `autoLinkGuestCustomers` — on registration, links guest purchases across
  tenants to the new authenticated user

---

#### `@prood/commerce` — Server Facade

**Location:** `packages/commerce`

Server-only (`server-only` package) facade that wraps `@prood/platform`,
provider registries, tenant integration config, and Next.js cache helpers
behind typed server functions.

| Module             | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `adapter.ts`       | Singleton platform instance: `getCommerce()`, `getAdapter()`, `getAdmin()`, `withTenant()`, `runScoped()` |
| `catalog.ts`       | Cached catalog: `getProducts`, `getProduct`, `getCategories`, `getStoreInfo`, `getBrands` |
| `cart.ts`          | Cart CRUD operations                             |
| `checkout.ts`      | Checkout operations, payment sessions, orders    |
| `payments.ts`      | Payment provider registry and factory            |
| `storage.ts`       | Storage singleton + tenant namespacing            |
| `integrations.ts`  | Per-tenant credentials from `integration_config` |
| `crypto.ts`        | AES-256-GCM encrypt/decrypt for integration secrets |
| `enforcement.ts`   | `assertLimit`, `assertFeature` (plan enforcement) |
| `revalidate.ts`    | `revalidateProducts/Categories/Catalog` (cache tags) |
| `tenant-store.ts`  | `provisionOrganizationStore()`                   |
| `customer-identity.ts` | Auth user to commerce customer linking       |

**Key patterns:**
- **Tenant isolation:** Optional `tenantId` → `runScoped()` → `withTenant()`
- **Caching:** Catalog uses Next.js `'use cache'`, `cacheTag`, `cacheLife` with
  tenant-scoped tags (`products-{tenantId}`)
- **Payments:** `getPaymentProvider(id, config?)` instantiates providers with
  per-tenant credentials

---

#### `@prood/auth` — Authentication Layer

**Location:** `packages/auth`

Canonical Better Auth setup on shared Neon Postgres. Provides organization
plugin, API keys, admin plugin, and Agent Auth tables.

| Export                    | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| Schema tables             | `user`, `session`, `account`, `verification`, `organization` (with `planId`, Stripe billing fields), `member`, `invitation`, `apikey`, `agentHost`, `agent`, `agentCapabilityGrant`, `approvalRequest` |
| `createAuth()`           | Better Auth instance factory                 |
| `createAuthGetter()`     | Cached session getter for RSC                |
| `getSession()`           | React `cache()` + `connection()` wrapper     |
| `getActiveOrganizationId()` | Resolve active tenant from session        |
| `createAppAuthClient()`  | Browser client for sign-in/out/org management|
| `resolveTrustedOrigins()`| CORS-safe origin list for cross-subdomain auth |

---

### Checkout Stack

#### `@prood/checkout` — State Machine

**Location:** `packages/checkout`

Framework-agnostic pure TypeScript state machine for payment flows. Zero
runtime dependencies beyond `@prood/types`.

**States:** `idle → info → shipping → payment → confirming → complete`
(with `failed → payment` retry)

**Channels:** `web`, `pos`, `agent`, `link`

**Fulfillment types:** `shipping`, `local_delivery`, `pickup`, `none`
(determines whether the shipping step is included)

**Key methods:** `setCustomerInfo`, `setShippingAddress`, `setShippingMethod`,
`setAmount`, `setOrderId`, `submitPayment()`, `confirmPayment()`,
`handleWebhookUpdate()`, `toSnapshot()`

---

#### `@prood/checkout-host` — Session Host

**Location:** `packages/checkout-host`

Server-only layer that persists `CheckoutSession` snapshots in Upstash Redis
and wires them to payment providers via `@prood/commerce`.

| Function                   | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `createCheckoutSession()`  | Create session (ID: `cs_*`), save to Redis  |
| `createPaymentLink()`      | Create expiring link (ID: `pl_*`)           |
| `loadAndHydrate()`         | Load session from Redis, rebuild state      |
| `persistSession()`         | Save updated snapshot back to Redis         |
| `buildCheckoutSessionUrl()`| Generate `/c/{sessionId}` URL               |
| `forwardPaymentWebhook()` | Forward webhook to Commerce API             |

---

### Providers

#### Payment Providers

All implement the `PaymentProvider` interface from `@prood/types`.

##### `@prood/payment-stripe`

**Location:** `packages/payment-stripe`

Stripe Checkout Sessions with `ui_mode: 'elements'`, returning a `clientSecret`
for the embedded Payment Element. Supports refund, capture, cancel, and webhook
verification (`stripe-signature` HMAC-SHA256).

##### `@prood/payment-easypay`

**Location:** `packages/payment-easypay`

Portugal-focused provider. Methods via `metadata.method`:
- `mb` — Multibanco reference (entity + reference for ATM payment)
- `mbw` — MB WAY (mobile payment)
- `cc` — Hosted card redirect

Async confirmation via webhook. Polls Easypay API for session status.

##### `@prood/payment-ifthenpay`

**Location:** `packages/payment-ifthenpay`

Portugal-focused provider. Methods:
- `multibanco` — Reference-based payment
- `mbway` — Mobile payment
- `creditcard` — Hosted card redirect

Callback verified via anti-phishing key.

#### Storage Providers

Both implement the `StorageProvider` interface from `@prood/types`.

##### `@prood/storage-vercel-blob`

**Location:** `packages/storage-vercel-blob`

Default provider. Uses `@vercel/blob` for uploads with `addRandomSuffix: true`.
Supports `createClientUploadToken()` for browser-direct uploads.

##### `@prood/storage-s3`

**Location:** `packages/storage-s3`

S3-compatible provider using `aws4fetch`. Works with AWS S3, Cloudflare R2, and
MinIO. Supports presigned upload/download URLs.

#### Notification Provider

##### `@prood/notification-resend`

**Location:** `packages/notification-resend`

Transactional email via Resend. When `message.template` matches a known
template ID, renders the corresponding React Email component from
`@prood/email`; otherwise uses raw HTML/text.

---

### Consumer Surfaces

#### `@prood/api-client` — Typed HTTP Client

**Location:** `packages/api-client`

Type-safe HTTP client for `apps/api`, generated from the OpenAPI spec.

```typescript
createCommerceApiClient({
  baseUrl,     // API base URL
  apiKey?,     // x-api-key header
  bearerToken?,// Authorization: Bearer header
  cookie?,     // Session cookie forwarding
  host?,       // x-storefront-host header
})
```

Exports `unwrap()` for error-throwing responses and `isCommerceApiError()`
type guard.

---

#### `@prood/ui` — Component Library

**Location:** `packages/ui`

68 React components built on shadcn/Radix + Tailwind CSS 4. Deep imports via
package.json exports map (`@prood/ui/components/*`).

**Primitives (30+):** button, input, textarea, select, checkbox, radio-group,
switch, label, card, badge, separator, skeleton, progress, tabs, accordion,
dialog, sheet, popover, dropdown-menu, command, tooltip, table, pagination,
breadcrumb, sidebar, scroll-area, empty-state, sonner

**Commerce-specific (33+):** product-card, product-grid, product-gallery,
product-price, product-options, product-type-badge, category-filter, cart-item,
cart-drawer, cart-summary, quantity-selector, coupon-input, free-shipping-bar,
address-form, checkout-header, checkout-footer, checkout-stepper, order-card,
order-timeline, review-stars, review-card, wishlist-grid, search-palette,
hero-banner, promo-banner

**Specialized product types:** auction-card, bid-panel, rental-card,
rental-booking-form, event-card, subscription-card, gift-card-form,
gift-card-balance, quote-request-form, price-tier-table

**Utility exports:**
- `@prood/ui/lib/utils` — `cn()` class merging
- `@prood/ui/lib/commerce` — `localized()`, `formatPrice()`, discount helpers
- `@prood/ui/hooks/use-mobile` — responsive breakpoint hook

---

#### `@prood/email` — Email Templates

**Location:** `packages/email`

React Email templates with shared layout, footer, and theme. Each template
exports its component and props type.

| Template              | Purpose                            |
| --------------------- | ---------------------------------- |
| `welcome`             | New account welcome                |
| `order-confirmation`  | Order placed successfully          |
| `order-shipped`       | Order fulfilled with tracking      |
| `order-refunded`      | Refund processed                   |
| `payment-failed`      | Payment failure notification       |
| `password-reset`      | Password reset link                |
| `team-invite`         | Team member invitation             |
| `activation`          | Account activation                 |

---

#### `@prood/billing` — Plans and Entitlements

**Location:** `packages/billing`

Single source of truth for subscription tiers, marketing copy, and entitlement
limits. Used by `apps/api` for enforcement and `apps/web` for pricing pages.

**Plans:** `free`, `grow`, `scale`, `agency`

**Marketing exports:** `getMarketingTier()`, `getPaidMarketingTiers()`,
`pricingFeatureRows` (comparison table), `pricingFaqs`, `pricingTrustPoints`

---

#### `@prood/cli` — Command-Line Tool

**Location:** `packages/cli`

Thin CLI over `@prood/api-client` for auth introspection, catalog/orders
listing, MCP config, and OpenAPI drift checks.

| Command                   | Action                              |
| ------------------------- | ----------------------------------- |
| `prood auth whoami`       | `GET /me` — show resolved caller    |
| `prood products list`     | `GET /products` — list products     |
| `prood orders list`       | `GET /orders` — list orders         |
| `prood mcp config`        | Print MCP server JSON for `/mcp`    |
| `prood openapi sync --check` | Check for OpenAPI drift          |

Supports `--api-url`, `--api-key`, `--bearer-token`, `--json` flags.

### Shared Tooling

| Package                       | Purpose                                     |
| ----------------------------- | ------------------------------------------- |
| **`@prood/typescript-config`** | Shared `tsconfig.json` bases (base, react-library) |
| **`@prood/eslint-config`**     | Shared ESLint configuration                 |

---

## Data Model

### Entity Relationships

The commerce data model follows an e-commerce standard with product-centric
catalog, cart-to-order conversion, and customer identity management.

**Catalog domain:**
- Products have images, variants, options (with values), attributes, tags
- Products belong to categories (many-to-many) and brands
- Categories form a tree via `parent_id`

**Commerce domain:**
- Customers have addresses; linked to Better Auth users via `auth_user_id`
- Carts hold items, coupon codes, addresses (JSONB), selected shipping/payment
- Orders snapshot line items, totals, addresses at time of placement
- Order history tracks status transitions with notes

**Engagement domain:**
- Wishlists (one per customer) with product items
- Reviews on products with rating and status
- Promotions with conditions and coupon codes
- Returns linked to orders with individual return items

**Product types:** `physical`, `digital`, `service`, `event`

**Localized fields:** Product names and descriptions stored as JSONB with
`{ en, pt, es }` structure.

### Order Status Model

Orders use a **three-dimensional status model** inspired by Commerce Layer:

| Dimension          | Values                                              |
| ------------------ | --------------------------------------------------- |
| Order status       | `placed`, `approved`, `fulfilled`, `cancelled`      |
| Payment status     | `pending`, `authorized`, `captured`, `refunded`, `failed` |
| Fulfillment status | `unfulfilled`, `partially_fulfilled`, `fulfilled`   |

This allows precise tracking of complex scenarios (e.g., an order can be
`placed` + `captured` + `unfulfilled` — paid but not yet shipped).

---

## Multi-Tenancy

### Architecture

Every merchant store is a **Better Auth organization**. All commerce data
carries an `organization_id` column. Tenant isolation is enforced at three
independent layers:

**Layer 1 — Postgres Row-Level Security (RLS)**

Every tenant-scoped table (27 tables) has a `tenant_isolation` policy:
```sql
organization_id = current_setting('app.current_org_id', true)
```
RLS is both **enabled** and **forced** (applies even to superuser/table owner).
With no session variable set, queries return zero rows — **fail-closed** design.

**Layer 2 — Transaction-Scoped Session Variable**

`withTenant(organizationId, callback)` opens a database transaction and sets
`app.current_org_id` before executing the callback. Uses Neon WebSocket Pool
(not HTTP) for connection affinity within the transaction.

**Layer 3 — Application WHERE Clauses**

Defense-in-depth `tenantCondition(table)` appended to every query module. Even
if RLS were somehow bypassed, application-level filtering prevents cross-tenant
data access.

### Domain Architecture

| URL Pattern               | App         | Tenant Resolution                    |
| ------------------------- | ----------- | ------------------------------------ |
| `{slug}.prood.app`        | Storefront  | `organization.slug` lookup           |
| `shop.client.com`         | Storefront  | `tenant_domain` table (verified)     |
| `dashboard.prood.com`     | Dashboard   | `session.activeOrganizationId`       |
| `api.prood.com`           | API         | `x-storefront-host` header or session |
| `checkout.prood.com`      | Checkout    | `tenantId` on session                |

### Per-Tenant Isolation Features

- **Payment credentials** — AES-256-GCM encrypted in `integration_config`;
  decrypted only at payment-time
- **Storage namespacing** — All uploads prefixed `org/{organizationId}/`
- **Cache isolation** — Tenant-scoped Next.js cache tags (`products-{orgId}`)
- **Webhook URLs** — Org-scoped: `/api/webhooks/{provider}/{orgId}`
- **Unknown-host fallback** — Unresolved hosts return 404 in production

### Merchant Onboarding Flow

1. Register at `dashboard.prood.com/register` → creates user + first org
2. Organization ID becomes tenant key for all commerce data
3. Storefront automatically available at `{slug}.prood.app`
4. Add custom domain in Dashboard → Vercel SDK + DNS verification
5. Configure payment provider credentials in Integrations
6. Add products, set up store settings, invite team members
7. Store is live

---

## Authentication and Authorization

### Auth Architecture

Better Auth is the authentication layer, with `apps/api` as the central auth
issuer. Different apps consume auth differently:

| App          | Auth Mechanism                                      |
| ------------ | --------------------------------------------------- |
| API          | Issues sessions; Better Auth handler at `/api/auth/*` |
| Dashboard    | BFF proxy to API auth; session cookie               |
| Storefront   | Own Better Auth instance for customer auth per origin |
| Checkout     | Stateless; sessions carry tenant context            |
| Admin        | Proxies to API auth; direct DB session validation    |

### Auth Plugins

| Plugin          | Purpose                                        |
| --------------- | ---------------------------------------------- |
| `organization`  | Multi-store tenants; hooks + invite emails     |
| `apiKey`        | Machine API keys with org metadata             |
| `admin`         | Platform admin via `ADMIN_USER_IDS`            |
| `agentAuth`     | Delegated + autonomous agent modes             |
| `nextCookies`   | Next.js cookie integration                     |

### API Scopes

```typescript
type ApiScope = "storefront" | "admin"
```

- **storefront** — catalog browsing, carts, checkout, customer orders
- **admin** — product/order/customer CRUD, store settings, inventory

### Cross-Subdomain Sessions

When `AUTH_COOKIE_DOMAIN` is configured, session cookies are shared across
`dashboard.prood.com`, `api.prood.com`, and `admin.prood.com`, enabling
seamless authentication across platform subdomains.

---

## Payment Processing

### Provider Architecture

Payment providers implement the `PaymentProvider` interface from `@prood/types`
and are registered in `@prood/commerce/payments.ts`. The system supports:

| Provider   | Package                     | Methods                        | Markets   |
| ---------- | --------------------------- | ------------------------------ | --------- |
| Stripe     | `@prood/payment-stripe`     | Card (Payment Element), 3DS   | Global    |
| Easypay    | `@prood/payment-easypay`    | Multibanco, MB WAY, Card      | Portugal  |
| Ifthenpay  | `@prood/payment-ifthenpay`  | Multibanco, MB WAY, Card      | Portugal  |

### Per-Tenant Credentials

Each merchant configures their own payment provider credentials in the
dashboard. Credentials are encrypted with AES-256-GCM before storage in
`integration_config`. At runtime, `getPaymentProvider(id, config?)` builds a
provider instance with the tenant's stored credentials, falling back to
environment variables per field.

### Webhook Verification

- **Stripe:** `stripe-signature` HMAC-SHA256 verification against merchant's
  stored webhook secret
- **Easypay / Ifthenpay:** Anti-phishing key verification or shared checkout
  secret (`x-checkout-secret`)
- Webhooks routed per tenant: `/api/webhooks/{provider}/{orgId}`

---

## Checkout Flow

The checkout process spans three applications:

```
Storefront (apps/storefront)
  → Customer fills 4-step checkout form
  → Server action places order via API
  → Creates payment session at Checkout app
  → Redirects customer to payment page

Checkout (apps/checkout)
  → Loads session from Redis
  → Renders payment UI (Stripe Element / Multibanco / redirect)
  → Customer completes payment
  → Webhook confirms payment async

API (apps/api)
  → Receives webhook from Checkout
  → Verifies payment signature
  → Updates order status
  → Sends confirmation email
  → Customer redirected to order confirmation
```

### Checkout Steps (Storefront)

1. **Contact** — Email, optional phone, marketing opt-in
2. **Address** — Full shipping address with Geoapify autocomplete; auto-detects
   country from Vercel `x-vercel-ip-country` header
3. **Shipping** — Loads available methods from API; user selects
4. **Review** — Order summary; triggers `startCheckout()` server action

### Place Order Flow

1. Read cart ID from cookie
2. `PUT` shipping and billing addresses on cart
3. Auto-select shipping method
4. `POST /carts/{id}/place-order` — creates order; enforces plan limits
5. Creates payment session at `CHECKOUT_URL/api/sessions`
6. Clears cart cookie
7. Returns `checkoutUrl` for browser redirect

---

## Order Lifecycle

### Status Transitions

```
Cart → Place Order → Order (placed)
                        ↓
                   Payment webhook
                        ↓
              Payment captured → approved
                        ↓
              Fulfill (tracking) → fulfilled
                        ↓
                   Completed
```

**Alternative paths:**
- Cancel → `cancelled` (with optional note)
- Refund → payment status `refunded` (with refund email)
- Payment failure → `payment_failed` (with failure email)

### Email Notifications (automated)

| Event              | Email sent                       |
| ------------------ | -------------------------------- |
| Order placed       | Order confirmation               |
| Order fulfilled    | Shipped notification (tracking)  |
| Order refunded     | Refund confirmation              |
| Payment failed     | Payment failure notification     |

---

## Subscription Plans and Billing

### Plan Tiers

| Feature             | Free       | Grow ($29/mo)  | Scale ($79/mo)  | Agency (custom)  |
| ------------------- | ---------- | -------------- | --------------- | ---------------- |
| Stores              | 1          | 1              | 1               | 10+              |
| Products            | 50         | 500            | Unlimited       | Unlimited        |
| Orders/month        | 100        | 1,000          | Unlimited       | Unlimited        |
| Team seats          | 1          | 3              | 10              | Unlimited        |
| Custom domains      | 1          | 3              | Unlimited       | Unlimited        |
| API access          | Read-only  | Full           | Full            | Full             |
| MCP / Agent Auth    | No         | Yes            | Yes             | Yes              |
| Branding removal    | No         | No             | Yes             | Yes              |
| Support             | Community  | Email          | Priority        | Dedicated        |

**Annual pricing:** ~17% discount (Grow $290/yr, Scale $790/yr)

### Plan Enforcement

Limits are enforced at the API level:
- `maxProducts` — checked on `POST /v1/admin/products`
- `maxOrdersPerMonth` — checked on `POST /v1/carts/:id/place-order`
- `maxTeamSeats` — checked in dashboard team invite action
- `maxCustomDomains` — checked in dashboard domain add action
- `agentAuthEnabled` — checked on Agent Auth JWT resolution
- `apiWriteEnabled` — checked on admin-scope API key resolution

---

## Security Posture

### Implemented Security Measures

1. **Encrypted secrets at rest** — `integration_config.config` values encrypted
   with AES-256-GCM using `INTEGRATION_ENCRYPTION_KEY`. Values without
   `enc:v1:` prefix treated as plaintext (dev/migration).

2. **Fail-closed RLS** — Forced row-level security on all 27 tenant tables. No
   `app.current_org_id` session variable = zero rows returned. Any code path
   forgetting `withTenant()` fails closed.

3. **Per-route auth scoping** — No global middleware. Each API route explicitly
   calls `requireCaller(scope)`. Unauthorized requests get structured error
   responses with appropriate HTTP status codes.

4. **Webhook verification** — Provider-specific signature verification (Stripe
   HMAC-SHA256) or shared checkout secret (`x-checkout-secret`).

5. **CORS** — Explicit trusted origins for cross-subdomain auth. Only known
   dashboard/storefront origins allowed.

6. **Storage namespacing** — All tenant uploads prefixed `org/{orgId}/` via
   `uploadForTenant()`. Vercel Blob uses `addRandomSuffix` for unguessable URLs.

7. **Session validation** — Admin app validates sessions directly from database,
   bypassing Better Auth origin checks.

8. **Unknown-host protection** — `resolveTenantId()` returns `notFound()` for
   unresolved hosts in production.

### Package Security Audit

| Package                | Tenant data?       | Status                              |
| ---------------------- | ------------------ | ----------------------------------- |
| `@prood/platform`      | Yes — commerce DB  | Isolated by forced RLS + `withTenant()` |
| `@prood/commerce`      | Yes — wraps platform | Tenant-threaded; per-tenant cache/payments |
| `@prood/checkout-host`  | Yes — sessions     | `tenantId` on session; provider rebuilt per tenant |
| `@prood/checkout`       | Per-session         | New instance per session; no mutable state |
| Payment providers      | Credentials only    | Stateless; config injected per tenant |
| Storage providers      | File uploads        | Tenant-namespaced via `uploadForTenant()` |
| `@prood/types`, `@prood/ui` | No            | Safe                                |

---

## AI and Agent Integration

### MCP Server

The platform exposes a **Model Context Protocol (MCP)** server at
`api.prood.com/mcp` via streamable HTTP transport. AI agents can browse
catalogs, manage carts, place orders, and perform admin operations.

**38 tools available:**
- 20 storefront tools: product search, cart management, checkout, orders
- 18 admin tools: full CRUD for products, categories, orders, customers, store
  settings, inventory, and dashboard stats

### Agent Auth Protocol

Discovery at `/.well-known/agent-configuration`. Capabilities are
auto-generated from OpenAPI `operationId` values, creating a 1:1 mapping
between REST endpoints and agent capabilities.

- **Delegated mode:** Agent acts on behalf of a user's session
- **Autonomous mode:** Agent operates with its own credentials
- **Device approval:** Merchants approve agent capability requests in the
  dashboard (`/device/capabilities`)
- **Plan requirement:** Agent Auth requires Grow+ plan (`agentAuthEnabled`)

### LLM-Readable Documentation

The documentation site provides machine-readable exports:
- `/llms.txt` — Index of all pages
- `/llms-full.txt` — Full concatenated documentation
- `/llms.mdx/docs/[slug]/content.md` — Per-page markdown

### CLI

`prood mcp config` outputs MCP server configuration JSON for integration with
AI tools and IDEs.

---

## Email and Notifications

### Email Provider

Transactional email is handled by `@prood/notification-resend` using the Resend
API. Templates are React Email components from `@prood/email`.

### Email Templates

| Template ID           | Trigger                          | Content                          |
| --------------------- | -------------------------------- | -------------------------------- |
| `welcome`             | User registration                | Welcome message                  |
| `activation`          | Account activation               | Activation link                  |
| `password-reset`      | Forgot password                  | Reset link                       |
| `order-confirmation`  | Order placed                     | Order summary, items, totals     |
| `order-shipped`       | Order fulfilled                  | Tracking info                    |
| `order-refunded`      | Order refunded                   | Refund details                   |
| `payment-failed`      | Payment failure                  | Failure notice                   |
| `team-invite`         | Team member invited              | Invitation link                  |

### Email Architecture

- Shared layout component (`EmailLayout`) with consistent branding
- Tailwind CSS styling via React Email's Tailwind component
- Custom font configuration
- Consistent footer across all templates

---

## Storage

### Provider Architecture

Storage providers implement `StorageProvider` from `@prood/types`. Selected via
`STORAGE_PROVIDER` environment variable (`vercel-blob` default, or `s3`).

### Tenant Namespacing

All file uploads are tenant-namespaced via `uploadForTenant(orgId, input)`,
which prefixes storage keys with `org/{organizationId}/`. This prevents
cross-tenant file access.

### Providers

| Provider              | Backend                | Presigned URLs | Browser Upload |
| --------------------- | ---------------------- | -------------- | -------------- |
| Vercel Blob (default) | Vercel Blob Storage    | No (direct)    | Yes (token)    |
| S3                    | AWS S3 / R2 / MinIO    | Yes            | Yes (presigned)|

---

## Documentation and LLM Access

### Human Documentation

59 MDX pages organized across 7 categories:

| Category        | Coverage                                               |
| --------------- | ------------------------------------------------------ |
| Getting Started | Installation, quick start, environment variables       |
| Architecture    | System design, multi-tenant, privacy, checkout, orders |
| Billing         | Plans and entitlements                                 |
| Applications    | All 7 apps with deep dives                             |
| Packages        | All shared packages                                    |
| Guides          | Merchants, agencies, machine access, onboarding, deployment |
| API Reference   | Interactive OpenAPI explorer                            |

### Machine Documentation

- **OpenAPI 3.1** — Live spec at `/v1/openapi.json`; synced to docs at build
- **LLM routes** — `/llms.txt`, `/llms-full.txt`, per-page markdown exports
- **MCP** — 38 tools with typed schemas
- **Agent Auth discovery** — `/.well-known/agent-configuration`
- **CLI** — `prood openapi sync --check` for drift detection

---

## Deployment

### Vercel Deployment

Each app deploys as a separate Vercel project sharing the same Neon database:

| App            | Production URL                  | Notes                             |
| -------------- | ------------------------------- | --------------------------------- |
| `apps/web`     | `https://prood.com`             | Marketing site                    |
| `apps/dashboard` | `https://dashboard.prood.com` | Merchant dashboard                |
| `apps/api`     | `https://api.prood.com`         | Auth issuer, REST API, MCP        |
| `apps/checkout` | `https://checkout.prood.com`   | Hosted checkout + payment webhooks |
| `apps/docs`    | `https://docs.prood.com`        | Documentation                     |
| `apps/storefront` | `https://{slug}.prood.app`   | Wildcard tenant storefront        |
| `apps/admin`   | `https://admin.prood.com`       | Restrict via `ADMIN_USER_IDS`     |

### Required Production Secrets

| Secret                        | Purpose                                |
| ----------------------------- | -------------------------------------- |
| `DATABASE_URL`                | Neon Postgres connection               |
| `BETTER_AUTH_SECRET`          | Auth signing secret (strong value)     |
| `CHECKOUT_API_SECRET`         | Checkout ↔ API authentication          |
| `INTEGRATION_ENCRYPTION_KEY`  | AES-256-GCM for stored credentials     |
| `UPSTASH_REDIS_REST_URL/TOKEN`| Checkout session storage               |
| `RESEND_API_KEY`              | Transactional email                    |
| `RESEND_FROM_EMAIL`           | Verified sender address                |
| `STOREFRONT_VERCEL_PROJECT_ID`| Dashboard domain automation            |
| `VERCEL_TOKEN`                | Domain provisioning API                |
| `ADMIN_USER_IDS`              | Platform admin user IDs                |

### CI Pipeline

GitHub Actions runs on every push:
1. `pnpm install` — dependency installation
2. `pnpm lint` — ESLint across all packages
3. `pnpm typecheck` — TypeScript compilation checks
4. `pnpm test` — Vitest unit tests
5. `pnpm build` — Production builds
6. Platform DB tests when `CI_DATABASE_URL` is configured

---

## Developer Experience

### Monorepo Setup

```bash
pnpm install           # Install all dependencies
cp .env.example .env.local  # Configure environment
pnpm env:link          # Generate per-app .env.local files
pnpm db:setup          # Migrate + seed database
pnpm dev               # Start all apps via Turbo
```

**Requirements:** Node.js 24, pnpm 10.33.4

### Key Scripts

| Command            | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Run all apps through Turbo                  |
| `pnpm lint`        | ESLint across workspace                     |
| `pnpm typecheck`   | TypeScript type checking                    |
| `pnpm test`        | Run all tests                               |
| `pnpm build`       | Production builds                           |
| `pnpm verify`      | Lint + typecheck + test + build             |
| `pnpm db:migrate`  | Migrate and seed commerce schema            |
| `pnpm db:auth`     | Apply Better Auth SQL migrations            |
| `pnpm db:setup`    | Full local database bootstrap               |

### Adding UI Components

```bash
pnpm dlx shadcn@latest add <component> -c packages/ui
```

Components are imported as `@prood/ui/components/<name>`.

### Environment Linking

`pnpm env:link` generates ignored `apps/*/.env.local` files from the root
`.env.local`, with local `BETTER_AUTH_URL` overrides per app.

---

## Planned Capabilities

The following capabilities have detailed architecture specifications but are not
yet implemented in the codebase.

### Content Engine

**Spec:** `_context/contente-engine-cms.md`

A commerce-native content management system — not a traditional CMS. Content is
structured JSON blocks that reference products, collections, and campaigns
dynamically.

**Core principles:**
- Content is data (structured JSON blocks, not stored HTML)
- Content is composable (pages = ordered blocks)
- Content references commerce (blocks reference products/collections dynamically)

**Block system:**
- Registry of typed blocks: hero, features, FAQ, product grid, testimonials,
  comparison table, CTA
- Each block has a `type`, Zod `schema`, and React `renderer`
- Shared between storefront rendering and visual editor

**Publishing workflow:**
- States: `draft → review → scheduled → published → archived`
- Immutable published versions; every save creates a new version
- Preview via Next.js Draft Mode

**AI integration:**
- AI generates block structures, not raw HTML
- Output is editable in the visual editor after generation

**Development phases:**
1. Block system, entries, media, publishing API
2. Visual page builder, product A+ content, preview URLs
3. Personalization, AI generation, analytics, experiments
4. Multi-language, audience segmentation, AI agents

---

### Event-First Platform

**Spec:** `_context/events-fist-platform.md`

An immutable, append-only event system as the source of truth for integrations,
auditing, automation, analytics, and AI agents.

**Core architecture:**
- Every meaningful business action produces an immutable event
- Events stored in Postgres with aggregate tracking
- Outbox pattern with QStash for reliable delivery
- Business write + event in same transaction (never fire-and-forget)

**Event types:** `store.*`, `product.*`, `customer.*`, `cart.*`, `order.*`,
`payment.*`, `inventory.*`, `subscription.*`

**Consumers:** ERP, CRM, warehouse, shipping, accounting, marketing automation,
AI agents — stored as `consumer_subscriptions`

**AI agents as consumers:**
- Sales, support, inventory, finance agents subscribe to event streams
- Cart abandonment, low inventory, payment failure triggers

**Analytics:**
- Projections from events: `daily_sales`, `customer_ltv`,
  `product_performance`
- Audit log as event projection (no separate audit system)

---

### Content Rendering Engine

**Spec:** `_context/rendering-engine.md`

A three-layer approach: Content Data → Rendering Engine → Visual Editor. The
rendering engine is built first and shared between the production storefront and
the editing experience.

**Key decisions:**
- Same React components render content in storefront and editor
- Visual editor wraps each block in `BlockFrame` for drag/drop/settings
- Sidebar controls auto-generated from Zod schemas
- Live preview via React state without save
- Draft mode via Next.js Draft Mode for preview URLs
- Product A+ content uses the same block system as pages

**Development phases:**
1. PageRenderer, block registry, draft system, media library
2. Sidebar editing, drag & drop, live preview
3. Reusable sections, global blocks, templates
4. AI page/section/product story generation

---

## Current Production Status

### Built and Verified (audit date: 2026-06-08)

- Full multi-tenant commerce stack — 7 apps, 15+ packages
- Postgres RLS tenant isolation — security audit completed
- Three payment providers — Stripe, Easypay, Ifthenpay with per-tenant credentials
- Hosted checkout — Redis session management, multi-provider payment UI
- Merchant dashboard — full CRUD, custom domains, team, integrations
- Commerce API — OpenAPI 3.1, MCP (38 tools), Agent Auth foundation
- Fumadocs documentation — 59 pages, LLM-readable exports
- CI pipeline — lint, typecheck, test, build via GitHub Actions
- Environment linking tooling for local development
- CLI tool for API introspection and OpenAPI drift detection

### Production Gaps

| Area                          | Status                                              |
| ----------------------------- | --------------------------------------------------- |
| SaaS subscription billing     | Placeholder — Stripe subscriptions not wired        |
| Dashboard analytics           | Placeholder page (coming soon)                      |
| In-dashboard API key creation | Implemented but not linked in sidebar navigation    |
| Observability                 | Sentry + PostHog not wired                          |
| CMS / marketing content       | Static MDX; Content Engine architecture spec only   |
| Email deliverability          | Requires Resend verified sender domain + DNS        |
| CI database tests             | Require `CI_DATABASE_URL` secret                    |
| Payment webhooks              | Must be configured per provider in production       |
| Agent/CLI maturity            | Foundation exists; contract alignment in progress   |

---

## Technology Stack Summary

| Layer              | Technology                                                |
| ------------------ | --------------------------------------------------------- |
| **Frontend**       | Next.js 16, React 19, Tailwind CSS 4, shadcn/Radix       |
| **Backend**        | Next.js App Router (Route Handlers + Server Actions)      |
| **Database**       | Neon Postgres (serverless), Drizzle ORM, Row-Level Security |
| **Auth**           | Better Auth (email/password, organizations, API keys, Agent Auth) |
| **Payments**       | Stripe, Easypay, Ifthenpay (pluggable interface)          |
| **Storage**        | Vercel Blob (default), S3-compatible (pluggable)          |
| **Cache/Sessions** | Upstash Redis                                             |
| **Email**          | Resend + React Email                                      |
| **Deployment**     | Vercel (edge + serverless), 7 independent projects        |
| **Monorepo**       | pnpm 10.33.4 + Turborepo                                 |
| **Testing**        | Vitest                                                    |
| **Docs**           | Fumadocs (MDX + OpenAPI), 59 pages                        |
| **AI/Agents**      | MCP Protocol (38 tools), Agent Auth, LLM-readable docs    |
| **CLI**            | `@prood/cli` — auth, catalog, orders, MCP, OpenAPI        |
| **Runtime**        | Node.js 24                                                |
| **CI**             | GitHub Actions                                            |
