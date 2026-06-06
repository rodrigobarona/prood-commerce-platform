Since you're asking for a memo/specification that you'll likely reuse as an architecture document, I'll put it in a writing block.

# Prood Event Platform Architecture (Event-First)

## Overview

Prood is a multi-tenant commerce platform built on:

* Next.js 16
* Vercel
* Neon PostgreSQL
* Better Auth
* Upstash Redis
* Upstash QStash
* Vercel Workflows

The platform follows an Event-First architecture.

Business events are the primary source of truth for integrations, auditing, automation, analytics, AI agents, and external systems.

Webhooks are not considered the platform's integration layer. Instead, webhooks are one of several consumers of the event stream.

---

# Tenant Model

Each store is an independent organization.

```text
Platform
│
├── Organization A (Store A)
│   ├── Users
│   ├── Orders
│   ├── Customers
│   └── Events
│
├── Organization B (Store B)
│   ├── Users
│   ├── Orders
│   ├── Customers
│   └── Events
│
└── Organization C (Store C)
```

Better Auth Organizations become the primary tenancy boundary.

Every business object must contain:

```ts
organizationId
```

Examples:

```ts
Product
Order
Customer
Inventory
Payment
Subscription
Discount
Event
```

All queries are organization-scoped.

---

# Event Philosophy

Every meaningful business action creates an immutable event.

Examples:

```text
store.created

product.created
product.updated
product.deleted

customer.created
customer.updated

cart.created
cart.abandoned

order.created
order.updated
order.fulfilled
order.cancelled

payment.authorized
payment.succeeded
payment.failed
payment.refunded

inventory.adjusted

subscription.created
subscription.cancelled
```

Events are append-only.

Events are never modified.

Events are never deleted.

The event stream becomes the historical record of the organization.

---

# Event Table

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    aggregate_type TEXT NOT NULL,
    aggregate_id UUID NOT NULL,

    event_type TEXT NOT NULL,

    payload JSONB NOT NULL,

    version INTEGER NOT NULL,

    occurred_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT now()
);
```

Example:

```json
{
  "id": "evt_123",

  "organizationId": "org_123",

  "aggregateType": "order",

  "aggregateId": "ord_456",

  "eventType": "order.created",

  "payload": {
    "orderId": "ord_456",
    "customerId": "cus_789",
    "total": 149.90,
    "currency": "EUR"
  }
}
```

---

# Aggregate Concept

Every event belongs to an aggregate.

Examples:

```text
Order
Customer
Product
InventoryItem
Payment
```

This enables rebuilding history.

Example:

```text
Order Created
Order Updated
Payment Succeeded
Order Fulfilled
```

All belong to:

order:ord_123

````

History can be reconstructed at any time.

---

# Event Publishing

Never insert directly into the events table.

Instead create a central Event Service.

```ts
await eventService.publish({
  organizationId,
  aggregateType: "order",
  aggregateId: order.id,
  eventType: "order.created",
  payload: {
    ...
  }
})
````

Every domain service uses the Event Service.

Examples:

```ts
OrderService
ProductService
CustomerService
PaymentService
InventoryService
```

This guarantees consistency.

---

# Transaction Pattern

Critical rule:

Business write and event creation must happen in the same transaction.

Example:

```ts
await db.transaction(async (tx) => {

  const order = await createOrder(tx)

  await createEvent(tx, {
    eventType: "order.created"
  })

})
```

Never publish events after commit.

Never use fire-and-forget.

This prevents missing events.

---

# Event API

External integrations consume events.

```http
GET /api/events
```

```http
GET /api/events?type=order.created
```

```http
GET /api/events?after=evt_123
```

Cursor pagination only.

Never use offset pagination.

---

# Event API Response

```json
{
  "data": [
    {
      "id": "evt_123",
      "type": "order.created",
      "occurredAt": "...",
      "payload": {}
    }
  ],

  "nextCursor": "evt_124"
}
```

---

# Event Consumers

Consumers subscribe to event types.

Example:

```text
ERP
CRM
Warehouse
Shipping
Accounting
Marketing Automation
AI Agents
```

Each consumer stores:

```sql
consumer_subscriptions
```

```text
organization_id
consumer_name
event_type
```

---

# Internal Event Bus

After storing an event:

```text
Database
    ↓
Outbox
    ↓
QStash
    ↓
Consumers
```

The event record remains the source of truth.

QStash is delivery infrastructure only.

---

# Outbox Pattern

Create:

```sql
event_outbox
```

When an event is created:

```text
Insert Event
Insert Outbox Record
Commit
```

Worker:

```text
Reads Outbox
Publishes QStash
Marks Processed
```

This guarantees no event loss.

---

# AI Agent Architecture

Future Prood AI features should consume events.

Example:

```text
order.created
payment.failed
inventory.low
cart.abandoned
```

Agent subscriptions:

```text
Sales Agent
Support Agent
Inventory Agent
Finance Agent
```

Agents become consumers of the event stream.

No additional infrastructure required.

---

# Analytics Architecture

Analytics should not query Orders directly.

Analytics consume events.

Example:

```text
order.created
payment.succeeded
refund.created
```

Projection workers build:

```sql
daily_sales
customer_ltv
product_performance
```

These become read models.

---

# Audit Log

Audit logs are projections of events.

Example:

```text
12:01 Product Created
12:04 Product Updated
12:15 Price Changed
```

No separate audit system required.

---

# Webhooks

Webhooks remain optional.

If implemented later:

```text
Event
 ↓
Webhook Delivery Worker
 ↓
Customer Endpoint
```

The webhook is generated from the event store.

Never the opposite.

---

# Vercel Workflows

Use Workflows for:

* Event replays
* Backfills
* Historical imports
* Projection rebuilding
* Bulk tenant migrations

Do not use Workflows for every event.

---

# Upstash Redis

Use Redis for:

* Idempotency
* Rate limits
* Caching
* Distributed locks

Do not store events in Redis.

Neon remains the source of truth.

---

# Long-Term Vision

The platform evolves into:

Business Action
→ Event
→ Event Store
→ Consumers

Consumers may include:

* Event API
* Webhooks
* Analytics
* Search indexing
* AI agents
* ERP integrations
* Marketing automation
* Warehouse systems

All integrations originate from a single immutable event stream.

This creates a Shopify-class architecture while remaining fully compatible with the Vercel, Neon, Better Auth, and Upstash ecosystem.

One additional recommendation: for Prood specifically, I would create a package called:

```text
@prood/events
```

that contains:

```ts
publishEvent()
createEvent()
getEvents()
replayEvents()
```

and a typed event registry:

```ts
type EventMap = {
  "order.created": OrderCreatedPayload
  "customer.created": CustomerCreatedPayload
  "payment.succeeded": PaymentSucceededPayload
}
```

This gives you compile-time type safety across your entire platform and becomes one of the most valuable internal packages as the codebase grows.
