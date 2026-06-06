# Prood Content Engine Architecture

## Executive Summary

The Content Engine is not a CMS.

The Content Engine is a platform capability that allows merchants to create, manage, version, publish, personalize, and reuse content across the entire commerce ecosystem.

The goal is to create a commerce-native content platform where content, products, collections, customers, campaigns, and future AI agents all operate on the same data model.

This architecture becomes the foundation for:

* Marketing pages
* Landing pages
* Blog articles
* Product A+ content
* Help centers
* Knowledge bases
* Campaigns
* SEO content
* AI-generated content
* Future personalization

---

# Core Principles

## Principle 1: Content is Data

Do not store content as rendered HTML.

Bad:

```html
<h2>Benefits</h2>
<p>Clinically tested...</p>
```

Good:

```json
{
  "type": "feature-list",
  "title": "Benefits",
  "items": [
    "Clinically tested",
    "Made in EU",
    "Third-party tested"
  ]
}
```

The frontend generates HTML.

The database stores structured content.

---

## Principle 2: Content is Composable

Pages are composed of blocks.

Example:

```text
Landing Page

├── Hero
├── Features
├── Testimonials
├── Product Grid
├── FAQ
└── CTA
```

Each block is independently editable.

---

## Principle 3: Content References Commerce

Content should understand:

* Products
* Collections
* Categories
* Brands
* Campaigns

Example:

```json
{
  "type": "product-grid",
  "collectionId": "summer-2026"
}
```

The content layer references commerce entities.

Commerce entities never duplicate content.

---

# System Architecture

```text
Content Engine

├── Content Types
├── Content Entries
├── Content Blocks
├── Media Library
├── Content References
├── Versioning
├── Publishing
├── Search
└── Personalization
```

---

# Database Design

## content_types

Defines schemas.

```sql
CREATE TABLE content_types (
  id UUID PRIMARY KEY,
  organization_id UUID,

  key TEXT NOT NULL,
  name TEXT NOT NULL,

  schema JSONB NOT NULL,

  created_at TIMESTAMP
);
```

Examples:

```text
page
landing-page
blog-post
faq
product-story
campaign
```

---

## content_entries

The actual content object.

```sql
CREATE TABLE content_entries (
  id UUID PRIMARY KEY,

  organization_id UUID NOT NULL,

  content_type_id UUID NOT NULL,

  slug TEXT,

  title TEXT,

  status TEXT,

  current_version INTEGER,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## content_versions

Immutable content snapshots.

```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY,

  entry_id UUID NOT NULL,

  version INTEGER NOT NULL,

  content JSONB NOT NULL,

  created_by UUID,

  created_at TIMESTAMP
);
```

Every save creates a version.

Nothing is overwritten.

---

## media_assets

Powered by Vercel Blob.

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,

  organization_id UUID,

  url TEXT NOT NULL,

  filename TEXT,

  mime_type TEXT,

  width INTEGER,
  height INTEGER,

  metadata JSONB,

  created_at TIMESTAMP
);
```

---

# Block System

Blocks are the most important concept.

Everything is built from blocks.

Example page:

```json
[
  {
    "id": "hero-1",
    "type": "hero"
  },

  {
    "id": "features-1",
    "type": "features"
  },

  {
    "id": "faq-1",
    "type": "faq"
  }
]
```

---

# Block Registry

Create a shared package:

```text
@prood/content
```

Example:

```ts
export const blockRegistry = {
  hero: HeroBlock,
  features: FeaturesBlock,
  faq: FAQBlock,
  productGrid: ProductGridBlock,
  testimonials: TestimonialsBlock
}
```

The editor and storefront use the same registry.

Single source of truth.

---

# Block Definitions

Every block has:

```ts
type BlockDefinition = {
  type: string

  schema: z.ZodSchema

  renderer: ReactComponent
}
```

Example:

```ts
const HeroBlock = {
  type: "hero",

  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    imageId: z.string()
  })
}
```

---

# Rendering

The storefront never stores HTML.

Instead:

```ts
blocks.map(block => {
  const Component =
    blockRegistry[block.type]

  return (
    <Component {...block.data} />
  )
})
```

Rendering happens at runtime.

---

# Product A+ Content

Products should have their own content model.

Example:

```text
Product

├── Specifications
├── Rich Story
├── FAQ
├── Comparison Table
├── Certifications
├── Videos
├── Downloads
└── Marketing Blocks
```

Database:

```sql
product_content
```

```sql
product_id
content_entry_id
```

Product content becomes reusable.

---

# Content References

Blocks can reference entities.

Example:

```json
{
  "type": "product-grid",

  "collectionId":
  "summer-collection"
}
```

or

```json
{
  "type": "featured-product",

  "productId":
  "prod_123"
}
```

References remain dynamic.

Content updates automatically when products change.

---

# Publishing System

States:

```text
draft
review
scheduled
published
archived
```

Database:

```sql
content_publications
```

Publishing should never overwrite drafts.

Published content is immutable.

---

# Preview System

Use Next.js Draft Mode.

Example:

```text
Draft Content
      ↓
Preview URL
      ↓
Merchant Review
      ↓
Publish
```

No content should be published without preview.

---

# Search

Phase 1:

Use PostgreSQL Full Text Search.

```sql
tsvector
```

Store searchable content projections.

---

# AI Layer

Future AI features should interact directly with blocks.

Examples:

```text
Generate Landing Page
Generate FAQ
Generate Product Story
Generate Blog Post
Generate Product Comparison
```

AI generates block structures.

Not HTML.

Example:

```json
[
  {
    "type": "hero"
  },

  {
    "type": "feature-list"
  },

  {
    "type": "faq"
  }
]
```

This allows merchants to edit AI-generated content visually.

---

# Event Integration

The Content Engine should publish events.

Examples:

```text
content.created
content.updated
content.published
content.unpublished

media.uploaded

page.created
page.published

product-content.updated
```

These events flow into the platform Event Engine.

---

# Permissions

Use Better Auth Organizations.

Permissions:

```text
Owner

Admin

Marketing Manager

Content Editor

Contributor
```

Content operations should be organization-scoped.

Every content query must include:

```ts
organizationId
```

---

# API Design

Examples:

```http
GET /api/content
```

```http
GET /api/content/:id
```

```http
POST /api/content
```

```http
POST /api/content/:id/publish
```

```http
GET /api/content/slug/:slug
```

Cursor pagination only.

---

# Recommended Development Phases

Phase 1

* Content Types
* Content Entries
* Block System
* Media Library
* Publishing

Phase 2

* Visual Page Builder
* Product A+ Content
* Preview URLs
* Version History

Phase 3

* Personalization
* AI Content Generation
* Content Analytics
* Content Experiments

Phase 4

* Multi-language
* Content Variants
* Audience Segmentation
* AI Agents

---

# Long-Term Vision

The Content Engine becomes a foundational platform capability.

Everything is built from:

Content Types
→ Content Entries
→ Content Blocks
→ Published Content

This enables:

* Marketing Sites
* Blogs
* Landing Pages
* Product Pages
* A+ Content
* Help Centers
* Knowledge Bases
* AI Generated Experiences

without introducing an external CMS.

The result is a commerce-native content platform deeply integrated with Prood's products, collections, customers, events, analytics, and future AI capabilities.

One architectural decision I'd emphasize to the team: **build the block system first, not the page builder**. The page builder UI can evolve over time. The block schema, versioning model, publishing workflow, and content API are the true foundation. If those are designed correctly, you can build multiple editors (visual, AI-assisted, form-based, API-driven) on top of the same content engine.
