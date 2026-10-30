# Prood brand

This document defines what Prood is, how it sounds and how it looks. The tokens
live in `packages/ui/src/styles/themes/prood.css`, the logo geometry in
`packages/ui/src/brand/geometry.ts`. If this document and the code disagree,
fix one of them in the same PR.

## 1. Positioning

**One line:** Open your store. Keep the keys.

**Value proposition:** Prood gives you a store on your own domain, checkout
through your own payment accounts, and an API your developers and AI agents can
use, with no cut of your sales.

**Positioning statement:** For independent merchants and the agencies that build
for them, mostly in Europe and starting with Portugal, Prood is an API-first
commerce platform. Every store gets its own domain, its own payment accounts and
the same API the dashboard is built on. Unlike all-in-one store builders, Prood
takes no fee on sales, supports Multibanco and MB WAY next to cards, and lets AI
agents work on a store only with the owner's approval.

"Keep the keys" is the idea everything hangs on. The merchant keeps:

- **their domain:** stores run on `{slug}.prood.app` or the merchant's own domain;
- **their payment accounts:** Stripe, Easypay or Ifthenpay credentials are per
  store and encrypted, and payouts go straight from the provider to the merchant;
- **their API keys:** organization keys for their own code;
- **the final say:** agents can read, but anything that changes data needs the
  merchant's approval through Agent Auth.

### Audiences

| Audience | What they want | What we lead with |
| --- | --- | --- |
| Merchants | A credible store live quickly, without a platform taking a cut | Own domain on Free, local payment methods, one calm dashboard |
| Agencies running many stores | Repeatable client builds, clean separation, client-owned accounts | Isolated organizations, client payment accounts and domains, invites without shared passwords, Agency plan (10 stores) |
| Developers and AI agents | A real API, not a theme engine | More than 40 REST operations under `/v1`, OpenAPI 3.1, TypeScript client, `prood` CLI, 40 MCP tools, Agent Auth discovery |

### What we may claim

Only what ships. Today that's: products, variants and categories with stock;
carts and hosted checkout; orders with payment, fulfillment and status history
(fulfill, cancel, refund); customers; coupons; custom domains provisioned
automatically with HTTPS; team invites; API keys; Agent Auth approvals; Stripe
(cards, Apple Pay, Google Pay), Easypay and Ifthenpay (Multibanco, MB WAY).

Not built, so never marketed: analytics, a CMS, wholesale, rentals, gift cards.
If one must be mentioned, label it "coming later" in plain words.

Plans come from `packages/billing/src/plans.ts` and nowhere else. Paid plans
aren't billed yet; say so wherever prices appear.

## 2. Personality and voice

Prood is **a straight-talking shopkeeper who can also code**. Practical, warm,
precise. It respects the merchant's money and time.

| We are | We are not |
| --- | --- |
| Direct: say the thing, then stop | Breathless: "revolutionary", "seamless", "unleash" |
| Specific: numbers, names, limits | Vague: "powerful", "robust", "best-in-class" |
| Plain: short words, short sentences | Jargon-first: "leverage", "synergy", "omnichannel" |
| Calm: confident without shouting | Pushy: fake urgency, exclamation marks |
| Honest: we say what isn't built yet | Hand-wavy about the roadmap |

**Tone shifts by context.** Marketing can carry a little attitude ("Keep the
keys."). Product UI is quiet and functional. Errors are calm and helpful. Legal
pages are plain language first.

### Vocabulary

- Say **store**, not "shop" or "tenant" (tenant is an engineering word).
- Say **payment account** or **payment provider**, not "gateway" or "PSP".
- Say **AI agent**, not "bot" or "AI". The feature is **Agent Auth**.
- **Prood** is always capitalized in text, lowercase only in the logo.
- Spell product terms the way the API does: **fulfillment**, **organization**.
  UI copy uses US spelling for consistency with the API and code.

## 3. UX writing rules

1. **Sentence case everywhere:** titles, buttons, menu items, table headers. Only
   proper nouns are capitalized ("Connect Stripe", "MB WAY").
2. **Buttons start with a verb** and say what happens: "Start free", "Add
   product", "Connect Stripe", "Approve". Never "OK", "Submit" or "Click here".
   Destructive buttons name the object: "Delete product", not "Delete".
3. **Errors follow what happened → why → what to do:**
   "We couldn't connect to Stripe. The secret key looks incomplete. Paste the
   full key from your Stripe dashboard and try again." Never blame the user,
   never show raw codes without a human sentence first.
4. **Empty states** say what will appear, why it matters and offer one action:
   "No orders yet. Orders show up here as soon as a customer checks out. Share
   your store link to get the first one." + "Copy store link".
5. **Confirmations** are specific and past tense: "Product published.", "Refund
   of €24.90 sent to the customer."
6. **Numbers and money**
   - Format with `Intl.NumberFormat` using the store's locale and currency. Never
     hand-build currency strings in components.
   - English UI defaults to European conventions: `€24.90` (symbol first, point
     decimal), `1,000 orders`. A `pt-PT` store shows `24,90 €`.
   - Dates: `29 Oct 2026` in English UI; relative ("2 hours ago") only for the
     last 24 hours. Times use 24-hour clock.
   - Always show the currency. Use tabular numerals (`tabular-nums`) in tables.
   - Platform plan prices are defined in US dollars in `@prood/billing`; show
     them exactly as `formatPrice` returns them.
7. **EU and Portugal first, English UI.** Portuguese payment methods appear next
   to cards, not in a footnote. Examples use European names, addresses and
   euros. The interface itself is English.
8. **Accessibility in copy:** link text makes sense out of context ("Read the
   payment setup guide", not "here"); icons that carry meaning get a label; alt
   text describes purpose, decorative images are hidden.

## 4. Color

Three named colors carry the brand: **Ink**, **Paper** and **Telha**.

- **Ink**, a deep blue-black, is the text and the primary action color. It keeps
  the product calm and lets data-dense screens breathe.
- **Paper**, a warm off-white like receipt paper, is the canvas.
- **Telha** is the burnt orange-red of Portuguese roof tiles. It's the signal:
  the logo, the one main call to action on a marketing page, active navigation,
  focus rings and highlights. It shows up rarely so that it keeps meaning.

**Why this and not a gradient.** Commerce SaaS defaults to violet gradients or
corporate blue. Telha is warm, physical and specific: it reads like a price tag
or a wax seal, it nods to where Prood starts, and it's distinct from the
platform's error red (crimson, hue 20) by both hue and use. Ink-on-paper keeps
everything else quiet. One loud color, used sparingly, is more recognizable than
a palette of five.

### Core palette

| Name | Light | Dark | Use |
| --- | --- | --- | --- |
| Ink | `oklch(0.2 0.02 260)` · `#11161F` | foreground `oklch(0.96 0.006 85)` · `#F4F1ED` | Text, primary buttons |
| Paper | `oklch(0.985 0.005 85)` · `#FCFAF6` | background `oklch(0.17 0.014 260)` · `#0C1016` | Page background |
| Telha | `oklch(0.555 0.18 38)` · `#C53E04` | `oklch(0.72 0.16 45)` · `#F47F46` | Brand, signal, focus |

In dark mode Telha lightens so it stays legible on ink, and its foreground flips
to ink.

### Semantic tokens

All apps use the shadcn token names (`background`, `foreground`, `primary`,
`muted`, …) plus these Prood additions:

| Token | Meaning |
| --- | --- |
| `brand`, `brand-foreground` | Telha fill and the text on it |
| `brand-subtle`, `brand-subtle-foreground` | Tinted badge or callout background and its text |
| `success`, `warning`, `destructive`, `destructive-foreground` | Status |
| `chart-1…5` | Telha, cobalt, teal, ochre, slate |

Rules: `primary` (Ink) is the default action. `brand` (Telha) appears at most once
per view as a filled button. Never use `brand` for destructive actions or
errors. Never put body text in `brand` on a tinted background; use
`brand-subtle-foreground`.

### Contrast (WCAG 2.2 AA, measured)

Ratios computed from the OKLCH values converted to sRGB. Text needs 4.5:1;
input borders, focus rings and chart marks need 3:1.

| Pair | Light | Dark |
| --- | --- | --- |
| foreground on background | 17.34:1 | 17.02:1 |
| foreground on card | 18.11:1 | 15.77:1 |
| muted-foreground on background | 6.26:1 | 7.71:1 |
| muted-foreground on muted | 5.73:1 | 6.45:1 |
| muted-foreground on sidebar | 5.99:1 | 7.45:1 |
| primary-foreground on primary | 17.34:1 | 16.12:1 |
| brand-foreground on brand | 5.02:1 | 7.29:1 |
| brand (as text) on background | 4.94:1 | 7.29:1 |
| brand (as text) on card | 5.16:1 | 6.75:1 |
| brand (as text) on muted | 4.53:1 | 6.10:1 |
| brand-subtle-foreground on brand-subtle | 6.54:1 | 8.24:1 |
| destructive on background | 5.87:1 | 6.63:1 |
| destructive-foreground on destructive | 5.96:1 | 6.63:1 |
| success on background | 5.44:1 | 9.07:1 |
| warning on background | 4.77:1 | 10.11:1 |
| input border on background (3:1) | 3.22:1 | 3.19:1 |
| ring on background (3:1) | 4.94:1 | 7.29:1 |
| chart-2 on background (3:1) | 6.41:1 | 7.65:1 |
| chart-3 on background (3:1) | 4.44:1 | 8.93:1 |

`border` (1.33:1) is decorative separation only; anything interactive uses
`input` for its boundary.

### Tenant-neutral theme

Merchant surfaces (storefront, hosted checkout) are the merchant's brand, not
ours. They import `@prood/ui/themes/neutral.css`: pure greys, `brand` equal to
`primary`, no Telha, no Prood fonts. Measured: foreground on background 19.79:1
(light) / 18.96:1 (dark), muted-foreground on background 6.00:1 / 7.98:1, input
border 3.36:1 / 3.30:1. Prood may appear there only as a small "Powered by
Prood" or "Secured by Prood" line, never as a logo.

## 5. Typography

| Role | Typeface | Why |
| --- | --- | --- |
| Headings (`font-heading`) | **Bricolage Grotesque**, variable, optical size on | A grotesque with ink traps and a slightly hand-cut warmth. Confident at display sizes, unlike the Inter/Geist look every SaaS shares |
| UI and body (`font-sans`) | **Instrument Sans**, variable | Compact, crisp and neutral at small sizes; pairs with Bricolage without competing |
| Code and numbers in code (`font-mono`) | **Geist Mono** | Clear at 13px, good tabular figures |

All three load through `next/font/google`, self-hosted at build time with size-adjusted
fallbacks, so there's no layout shift and no request to Google at runtime. Each
app maps them to `--font-family-sans`, `--font-family-heading` and
`--font-family-mono`, which `@prood/ui/globals.css` turns into Tailwind's
`font-sans`, `font-heading` and `font-mono`. Headings `h1`–`h4` use
`font-heading` by default.

**Scale (marketing):** display 72/64/48px with -0.04em tracking and 1.0 line
height; section titles 44/30px, -0.025em; lead 20/18px at 1.6; body 16px at 1.75;
small 14px. **Product UI:** body 14px, headings 16–24px, tighter tracking only
above 24px. Eyebrows are Geist Mono, 12px, uppercase, +0.12em, in Telha.

## 6. Logo

The logo is drawn, not typed: geometry lives in `packages/ui/src/brand/geometry.ts`.

- **Wordmark:** lowercase `prood` built from one stroke weight (5.5 on a 24-unit
  x-height) and perfect circles. The double `oo` is the rhythm of the name.
- **Mark:** a Telha tile with a paper `p` whose stem runs off the bottom edge,
  like a tag on a string or a key in a lock. It works from 16px favicons up.
- **Lockup:** mark + wordmark, wordmark x-height at 0.4× the mark height, gap of
  a quarter mark.

Components in `@prood/ui/components/logo`:

```tsx
<Logo className="h-7" />            // lockup, wordmark in currentColor
<LogoMark className="size-8" />     // tile only
<Wordmark className="h-6" />        // wordmark only, currentColor
<Logo title={null} />               // decorative, when a label sits nearby
```

Rules: keep clear space of half the mark height on every side. Wordmark in Ink on
light, Paper on dark, never in Telha. The tile is always Telha with a Paper `p`.
Don't stretch, outline, rotate, add effects or retype the logo in a font.

App icons (`icon.svg`, `favicon.ico`, `apple-icon`) and Open Graph images for
web, dashboard, docs and admin are generated from the same geometry
(`@prood/ui/brand/og-image`).

## 7. Iconography

One family: **Phosphor** (`@phosphor-icons/react`), regular weight in UI, bold
only for small checkmarks. 16px in dense UI, 20–24px in marketing, 28px max for
feature icons. Icons inherit `currentColor`; brand-colored icons are reserved
for feature lists and status. In Server Components import from
`@phosphor-icons/react/dist/ssr`. Don't add another icon library.

## 8. Space, radius and elevation

- **Spacing:** Tailwind's 4px scale. Marketing sections use 80/112px vertical
  rhythm, content max width 72rem (`max-w-6xl`), gutters 20–24px.
- **Radius:** `--radius: 0.375rem` (6px). Inputs and small controls use `md`,
  cards `xl` (≈8px), large panels `2xl`. Pills only for badges and segmented
  controls.
- **Borders over shadows.** Surfaces separate with a 1px `border`. One soft shadow
  is allowed for floating panels (menus, the hero illustration).
- **Decoration:** the single motif is the wordmark's ring, used large, cropped
  and in a muted tone behind page heroes. No gradients, glows or noise.

## 9. Motion

Motion explains, it doesn't decorate.

- Durations: 120ms (hover, press), 200ms (disclosure, menus), 320ms (page-level
  panels). Nothing longer than 400ms.
- Easing: `ease-standard` = `cubic-bezier(0.2, 0, 0, 1)` to enter,
  `ease-exit` = `cubic-bezier(0.4, 0, 1, 1)` to leave.
- Animate opacity and transform only. Buttons press down 1px on `:active`.
- `prefers-reduced-motion: reduce` disables transitions, animations and smooth
  scrolling globally (see `@prood/ui/globals.css`).

## 10. Domains

Marketing at `prood.com`. Platform services at `dashboard.`, `api.`,
`checkout.`, `docs.` and `admin.prood.com`. Merchant stores on
`{slug}.prood.app` or the merchant's own domain; the separate registrable domain
keeps tenant content and cookies away from Prood's own services. Canonical URLs
for the marketing site always use `https://prood.com`.
