# Prood brand

This document defines what Prood is, how it sounds and how it looks. The tokens
live in `packages/ui/src/styles/themes/prood.css`, the logo geometry in
`packages/ui/src/brand/geometry.ts`, and how to build with them in
`packages/ui/DESIGN.md`. If this document and the code disagree, fix one of them
in the same PR.

## 1. Positioning

**One line:** Commerce, ready to run. Keep the keys.

**Value proposition:** Prood hosts your store, checkout and orders. You run it on
your own domain, take Multibanco, MB WAY and cards through your own payment
accounts, and build on an API your developers and AI agents can use. Don't say
checkout runs on the store's domain: it's one shared Prood host.

**Positioning statement:** For agencies and developers who build stores for
clients, and the independent merchants they serve, in Europe and starting with
Portugal, Prood is hosted, API-first commerce. Unlike frameworks you deploy and
operate yourself, it's already running. Unlike closed store builders, the domain,
payment accounts and API keys stay yours, and Multibanco and MB WAY sit next to
cards with no plugin to install first.

**Category:** say "hosted commerce" or "API-first commerce". Don't say "open
source" or "open commerce": the engine isn't open source, and Shopware claims
"open commerce infrastructure". "Keys" means accounts and access, never that a
store can be taken elsewhere: there's no export or owner transfer yet.

**Europe:** Prood is built for Europe, and that's a real difference from rivals
that bill in dollars. Say "priced in euros" and "hosted in Frankfurt", or "your
store's database and servers run in Frankfurt, Germany". Never say "GDPR compliant",
"GDPR certified" or that data "never leaves the EU": email delivery and the content
network can process data elsewhere.

**Message order:** first, commerce that's already running on your own accounts.
Then, by audience: Multibanco and MB WAY next to cards; separate client stores on
one login; the API and MCP. Last: the free start and how Prood charges.

"Keep the keys" is the idea everything hangs on. The merchant keeps:

- **their domain:** stores run on a `prood.app` address or the merchant's own
  domain;
- **their payment accounts:** Stripe, Easypay or Ifthenpay credentials are stored
  separately for each store and encrypted at rest with AES-256-GCM, and payouts go
  straight from the provider to the merchant;
- **their API keys:** organization keys for their own code;
- **the final say:** with Agent Auth, an AI agent starts with nothing until the
  merchant approves it for their store. After that it keeps the public catalog,
  and anything else needs the merchant's approval. They see every capability the
  agent asks for and approve or deny the request as a whole. Approved access ends after
  an hour idle, or 24 hours at most. Then the agent asks again. An API key isn't
  Agent Auth: anything holding an admin key can do what the key allows, without
  asking.

### Audiences

| Audience | What they want | What we lead with |
| --- | --- | --- |
| Merchants | A credible store live quickly, taking the payments their customers use | Own domain on Free, local payment methods, one calm dashboard |
| Agencies running client stores | Repeatable client builds, clean separation, client-owned accounts | Each client store has its own catalog, orders, customer records, API keys and payment accounts. "Running several client stores? Email us." |
| Developers and AI agents | A real API, not a theme engine | More than 40 REST operations under `/v1`, OpenAPI 3.1, TypeScript client and `prood` CLI (from the source repo for now), 41 MCP tools, Agent Auth discovery |

### What we may claim

Only what ships, and only as far as it goes. Today that's:

- **Store:** "Products with prices, descriptions and an in-stock switch." That's
  what the dashboard ships. Variants, categories, stock counts and product photo
  upload aren't in it: don't claim them. The API can add categories and sizes,
  starting on Grow. It can't add photos on any plan: images must already be on
  Prood's bucket and there's no upload route. Carts and hosted checkout; customers;
  orders with payment, fulfillment and status history.
- **Orders:** fulfill, cancel and refund. Refunds run through Stripe and, for MB
  WAY and cards, Easypay (Easypay can't pay a Multibanco reference back). Others
  the merchant records in the dashboard.
- **Payments:** Stripe (cards, plus Apple Pay and Google Pay where you've enabled
  them in Stripe and registered the checkout domain), Easypay and Ifthenpay
  (Multibanco, MB WAY and cards in one checkout). Each store's checkout runs on one
  provider, and Stripe comes first if it's connected: never imply a checkout mixes
  providers. Each store's credentials are stored separately and encrypted at rest
  with AES-256-GCM. Don't say "encrypted per store": there's one key. On merchant
  sections say "encrypted, and only used to talk to your provider". The cipher, key
  formats and headers stay on `/developers` and in the docs.
- **Domains:** custom domains provisioned automatically with HTTPS. "You choose
  your store's prood.app address when you sign up. If it's taken, we add a few
  characters to the end."
- **Shipping:** fixed for now: Standard 15.00 in the store's currency (5 to 7
  days), Express 35.00 (1 to 2 days). Your store shows these to shoppers. Setting
  your own rates is coming later. Samples use the real rates, so a receipt's
  arithmetic holds. There's no pickup, so show trades that post well.
- **API:** "Catalog, orders, customers, inventory and store settings all run on
  /v1, the same calls the dashboard makes. Payment accounts, domains, team and keys
  stay in the dashboard." Don't say "everything a merchant can do by hand". Free
  API keys reach the public storefront API: catalog, carts and placing orders.
  Payment runs on hosted checkout, started from the store. Reading orders and
  customers by API, and all admin writes, start on Grow. Keys look like `pk...`,
  with no underscore. Errors are `{ code, message }`.
- **AI agents:** the wording under "the final say" above, once per page, and on
  merchant sections stop before the sentence about admin keys. Never
  "one capability at a time", never "until revoked", never "agents can read", and
  never "changes need approval" without saying it's Agent Auth. Wherever agents
  are the claim, add "Agent Auth is coming with Grow." For
  MCP, add "Free keys reach the 21 storefront tools." 18 of them do useful work with a
  bare key: where the number is the point, say so.
- **Team:** invites start on Grow. Free has one seat, the owner.
- **Several stores:** one login can hold several stores, through Add store in the
  store switcher, so "One login. Every client store." is true. Beyond that,
  "Running several client stores? Email us." Paid plans can't be bought yet. The
  Agency plan stays in the plan slips and the pricing table as listed in `plans.ts`,
  next to the not-billed notice and with no store count. `/agencies` doesn't sell
  it. There's no export and no owner transfer: never say a client can take a store
  over, or that a client "owns" one.
- **Limits:** live today. 50 products and 100 orders a month on Free, plus seats
  and domains. Order 101 is refused until the next month.
- **Packages:** `@prood/api-client` and `@prood/cli` aren't published: say
  "available from the source repo for now". The same goes for every workspace
  package: never `pnpm add @prood/...`.
- **Tax:** prices are what the merchant enters. Prood doesn't calculate VAT or
  issue invoices yet.
- **Plans on the page:** the action is on Free. Paid plans read "Coming", with a
  planned price and no yearly option until billing exists.
- **Numbers:** more than 40 REST operations, 41 MCP tools (21 storefront, 9 staff,
  11 admin).

Not built, so never marketed: analytics, a CMS, wholesale, rentals, gift cards,
coupons anyone can create, a storefront coupon field, product variants and photo
upload in the dashboard, returns, terms and privacy pages for stores, a language
choice for stores, merchant revocation of agent
access, removing Prood branding, an upgrade path, and agencies inviting clients on
Free. If one must be mentioned, label it "coming later" in plain words. Don't state
any store count (it isn't enforced, and Free can create more than one), unlimited
seats (membership stops at 100), or that Portuguese shoppers prefer anything (we
have no source for it).

Plans come from `packages/billing/src/plans.ts` and nowhere else. Paid plans can't
be bought and aren't billed yet; say so wherever prices appear, and write "Paid
plans are coming", never "upgrade".

A provider's rate appears only with the provider, what it covers and the date it
was checked. The `/pricing` closing slip uses Stripe's published Portugal price for
a standard EEA card, and says Multibanco and MB WAY fees depend on the provider and
contract. Easypay's public list is a ceiling, not what a merchant pays, so its link
asks for a proposal and never reads as a price list. Check the figure again when you
touch that page.

Samples are labeled as samples. Example hosts use reserved names, such as
`loja.casalume.example`, or a `prood.app` address: a made-up `.pt` or `.com` can be
someone's real domain. Faces carry "Stock photo" where they stand next to a
claim, at most once per section. `/credits` carries the full statement.
Hands and streets don't need it. The hero film says "Stock film." "Paid plans aren't billed yet" appears once under
each block of prices, not as a sign-off.

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

- Say **store**, not "shop" or "tenant" (tenant is an engineering word). The
  physical shop in the design story keeps its name in design docs only.
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
3. **Lead with what the customer gets.** The fee is a fact about how Prood charges,
   not a selling point. It appears on `/pricing` (the note under the plans, the FAQ
   and the worked example), once on the home page and once on `/integrations`. Say
   "charges by plan, not by sale" or "no percentage of your sales". Never "0%" or
   "no cut" as a headline.
4. **Limits follow the claim, as facts.** Inline if a limit changes whether the claim
   is true, a tag if it only scopes it ("Example", "Stock photo"), otherwise the list
   on `/pricing`. Don't chain unrelated notices, and don't end a section on one.
5. **Errors follow what happened → why → what to do:**
   "We couldn't connect to Stripe. The secret key looks incomplete. Paste the
   full key from your Stripe dashboard and try again." Never blame the user,
   never show raw codes without a human sentence first.
6. **Empty states** say what will appear, why it matters and offer one action:
   "No orders yet. Orders show up here as soon as a customer checks out. Share
   your store link to get the first one." + "Copy store link".
7. **Confirmations** are specific and past tense: "Product published.", "Refund
   of €24.90 sent to the customer."
8. **Numbers and money**
   - Format with `Intl.NumberFormat` using the store's locale and currency. Never
     hand-build currency strings in components.
   - English UI defaults to European conventions: `€24.90` (symbol first, point
     decimal), `1,000 orders`. A `pt-PT` store shows `24,90 €`.
   - Dates: `29 Oct 2026` in English UI; relative ("2 hours ago") only for the
     last 24 hours. Times use 24-hour clock.
   - Always show the currency. Use tabular numerals (`tabular-nums`) in tables.
   - Platform plan prices are defined in euros in `@prood/billing`; show them
     exactly as `formatPrice` returns them.
9. **EU and Portugal first, English UI.** Portuguese payment methods appear next
   to cards, not in a footnote. Examples use European names, addresses and
   euros. The interface itself is English.
10. **Accessibility in copy:** link text makes sense out of context ("Read the
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
| paper on Telha (`surface-telha`, `surface-photo` brand button) | 4.94:1 | 4.94:1 |
| brand (as text) on background | 4.94:1 | 7.29:1 |
| brand (as text) on card | 5.16:1 | 6.75:1 |
| brand (as text) on muted | 4.53:1 | 6.10:1 |
| brand-subtle-foreground on brand-subtle | 6.54:1 | 8.24:1 |
| destructive on background | 5.87:1 | 6.63:1 |
| destructive-foreground on destructive | 5.96:1 | 6.63:1 |
| success on background | 5.44:1 | 9.07:1 |
| warning on background | 6.14:1 | 10.11:1 |
| warning on its 14% tint (status badge) | 5.01:1 | 7.90:1 |
| input border on background (3:1) | 3.22:1 | 3.19:1 |
| ring on background (3:1) | 4.94:1 | 7.29:1 |
| chart-2 on background (3:1) | 6.41:1 | 7.65:1 |
| chart-3 on background (3:1) | 4.44:1 | 8.93:1 |

`border` (1.33:1) is decorative separation only; anything interactive uses
`input` for its boundary.

### Tenant-neutral theme

Merchant surfaces (storefront, hosted checkout) share the design system but are
the merchant's brand, not ours. They import `@prood/ui/themes/neutral.css`: pure
greys, `brand` equal to `primary`, no Telha, no Prood fonts. Measured: foreground on background 19.79:1
(light) / 18.96:1 (dark), muted-foreground on background 6.00:1 / 7.98:1, input
border 3.36:1 / 3.30:1. Prood may appear there only as a small "Powered by
Prood" line, never as a logo. Don't write "Secured by Prood": the payment
provider provides the payment security, not Prood.

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

The example signs on the home page's street are pictures of signs, so each has its
own lettering, from `sign-lettering.ts`. Those faces aren't part of the type system
and appear nowhere else.

**Scale (marketing):** fluid display sizes from `text-display-xl` (up to 136px)
to `text-display-sm`, with tracking from -0.016em to -0.006em and no common
ligatures, so letters never touch at display size, and `text-lead` for the
paragraph beneath; see `packages/ui/DESIGN.md`. **Product UI:** body 14px,
headings 16–24px, tighter tracking only above 24px. Eyebrows are Geist Mono,
12px, uppercase, +0.12em, in Telha.

## 6. Logo

The logo is drawn, not typed: geometry lives in `packages/ui/src/brand/geometry.ts`.

- **Wordmark:** lowercase `prood` built from one stroke weight (5.5 on a 24-unit
  x-height) and perfect circles. The double `oo` is the rhythm of the name.
- **Mark:** a hanging Telha roof tile, one tile off the eave, flat at the head and
  round at the foot, with the wordmark's own `p` running off its lower
  edge. The silhouette is what makes it Prood's at 16 and 28px; a rounded square
  read as any orange app icon.
- **Lockup:** mark + wordmark, wordmark x-height at 0.45× the mark height, so the
  wordmark leads, gap of a quarter mark.

**The key** isn't the logo: it's the brand's object. `KeyMark`
(`@prood/ui/components/key-mark`) takes the wordmark's ring for its bow, the stroke
for its shaft and two tiles off the eave for its bit. Use it on the key board, on
key tags, and anywhere the subject is keys or access: never as a bullet or a
decoration, and never in place of the logo. It may hang or lie flat. On
`/integrations` it's the poster, the `cut` key: flat, with no shadow or tilt, a short
shank, one groove, and a bit in stepped teeth, not the tiles. The right edge takes
less than a third of the bow, so the ring reads first. Its tip sits on the page's
center line, and all of it stays clear of the seam.

Components in `@prood/ui/components/logo`:

```tsx
<Logo className="h-7" />            // lockup, wordmark in currentColor
<LogoMark className="size-8" />     // tile only
<Wordmark className="h-6" />        // wordmark only, currentColor
<Logo title={null} />               // decorative, when a label sits nearby
```

Rules: keep clear space of half the mark height on every side. Wordmark in Ink on
light, Paper on dark, never in Telha. The tile is always the true Telha token with
a Paper `p`, on photographs and in dark mode too.
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

- **Spacing:** Tailwind's 4px scale. Marketing sections use 80/128px vertical
  rhythm, content max width 84rem, gutters 20–48px.
- **Radius:** `--radius: 0.5rem` (8px). Controls use `lg`, cards and panels `xl`,
  large marketing frames `3xl`. Pills only for `hero` buttons, status and
  segmented controls.
- **Borders over shadows.** Surfaces separate with a 1px `border`. Shadows are for
  floating layers and for product fragments lifted over a photograph.
- **Motif:** filled tiles drawn from the wordmark's ring, always hanging downward
  like an eave or a shop awning: `TileEdge` at section seams, `TileField` as faint
  filled courses behind Ink and Telha panels. No hairlines, nothing rising; under a photograph the course is a Telha awning. No
  glows or noise. The only gradients are the ink scrims that keep text legible on
  photographs.
- **Receipts:** the `Receipt` is a system, not a garnish: the sale in the hero, the
  plans as till slips, the agency ledger, the Multibanco reference in the home
  page's payments section, the key ledger on
  `/developers`, the money path on `/integrations`, and the closing
  slip, made out for each page (by client store for agencies, by key for developers). Legible first, and
  only on sample data or real plan data. A slip ends on what the reader gets, such
  as a direct payout, never on Prood's fee.
- **Key tags:** "Four things that stay in your hands" hangs on a key board, four
  keys with paper tags on a rail. One section on the home page, and one tag on
  `/developers`: don't turn it into a card style.
- **Owned objects on inner heroes:** one per hero, crossing the seam at the right:
  a plan slip on pricing, the client ledger on agencies, a key tag on developers.
  Always labelled as examples, or real plan data.
- **Imagery:** real people, hands and street fronts, all in one grade. See
  "Photography and film" in `packages/ui/DESIGN.md`.

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
