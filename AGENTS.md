# AGENTS.md — SupplyLine Wholesale Platform

This file is the build guide for any agent (human or AI) working on this codebase. It defines tech stack, conventions, and a phased roadmap. Work through phases in order — each phase should be shippable/demoable on its own before moving to the next.

---

## 0. Tech Stack

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes / Route Handlers |
| Database | Supabase (Postgres) |
| Auth | Clerk (Organizations = business accounts) |
| Payments | Stripe (Payment Intents + Webhooks) |
| Hosting | Vercel (recommended, generic-compatible) |
| Email | Resend or Postmark (Phase B7) |
| Error tracking | Sentry (Phase B8) |

---

## 1. Repository Conventions

```
/app                    → Next.js App Router pages & layouts
  /(storefront)          → public/buyer-facing routes
  /admin                  → admin-only routes
  /api                    → route handlers (backend)
/components             → shared UI components
/lib
  /supabase               → db client(s), server + browser
  /clerk                  → auth helpers
  /stripe                 → stripe client, webhook helpers
  /pricing.ts              → single source of truth for price-tier logic
/types                  → shared TypeScript types (generated + manual)
/supabase/migrations    → versioned SQL migrations (never edit schema via dashboard only)
/tests                  → unit + integration tests
```

**Rules for agents:**
- Never hardcode prices, tax rates, or stock counts in components — always fetch from `lib/pricing.ts` or the DB.
- All money values stored and computed in **cents** (integers) server-side; format to currency only at render time.
- Every mutation (`POST`/`PATCH`/`DELETE`) API route must validate the authenticated user's role/ownership before touching data (see Phase B2 — RLS is not a substitute for route-level checks).
- Client never sends a price — server always recalculates from `product_id` + `cases` + account tier.
- Commit migrations before writing code that depends on new columns/tables.

---

## FRONTEND

## Phase F0 — Frontend Scaffold
**Goal:** Next.js app boots, styled shell, routing skeleton in place.

- [x] Initialize Next.js 14 (App Router) + TypeScript + Tailwind
- [x] Set up design tokens (colors from prototype: navy `#0F172A`, sky `#38BDF8`, bg `#F8FAFC`)
- [x] Global layout: top nav shell (logo, search bar, nav links, cart icon) + footer
- [x] Route skeleton (empty pages, no data yet):
  - `/` (home)
  - `/catalog` (category + search results)
  - `/products/[sku]`
  - `/cart`
  - `/checkout`
  - `/quick-order`
  - `/reorder`
  - `/admin` (placeholder, gated later)
- [x] Responsive breakpoints defined (mobile nav collapses to hamburger)
- [x] Loading and error boundary components (`loading.tsx`, `error.tsx` per route group)

**Done when:** All routes render static placeholder content with the shared nav/footer, deployed to a Vercel preview URL.

---

## Phase F1 — Auth UI (Clerk)
**Goal:** Sign-up/sign-in flows work; UI reflects auth state.

- [x] Install `@clerk/nextjs`, wrap app in `<ClerkProvider>`
- [x] Sign-in / sign-up pages (`/sign-in`, `/sign-up`) using Clerk's prebuilt components, restyled to match brand
- [x] Org creation/join flow for business accounts (Clerk Organizations UI or custom flow)
- [x] Nav bar reflects auth state: signed-out → "Sign in" button; signed-in → account menu (name, org name, "My orders", "Sign out")
- [x] Individual (retail) vs. business account selector at signup
- [x] Route protection UI: redirect unauthenticated users hitting `/checkout`, `/account/*`, `/admin/*` to sign-in

**Done when:** A user can sign up as either an individual or a business (org), sign in/out, and see their state reflected in the nav.

---

## Phase F2 — Product Catalog UI
**Goal:** Browse, search, and filter real products (reads live data — depends on Backend Phase B3).

- [x] Home page: hero, category grid (dynamic from `categories` table)
- [x] Catalog page: category sidebar filter, search input (debounced), product grid
- [x] Product card: image, name, SKU, stock badge, starting case price, "Add to cart" button
- [x] Product detail page: image, full tier pricing table, quantity stepper, live price recalculation, stock status, add-to-cart
- [x] Empty/loading/error states for search with no results
- [x] Pagination or infinite scroll for catalog grid

**Done when:** A signed-in user can browse, search, filter by category, and view accurate live pricing per product (business vs. retail).

---

## Phase F3 — Cart UI
**Goal:** Cart reflects server-persisted state, not local-only React state.

- [x] Cart page: line items (image, name, SKU, qty stepper, per-unit price, line total, remove)
- [x] Order summary panel: subtotal, shipping estimate, tax, total, free-shipping progress nudge
- [x] Cart icon in nav shows live item count (synced with server)
- [x] Optimistic UI updates on qty change with rollback on API failure
- [x] Empty cart state with CTA back to catalog

**Done when:** Cart persists across page reloads and devices (same logged-in user), backed by Backend Phase B4.

---

## Phase F4 — Checkout UI
**Goal:** Multi-step checkout wired to real Stripe Elements and real order creation.

- [x] Step 1: Customer info (pre-filled from Clerk/business account if available)
- [x] Step 2: Shipping address (select saved address or add new)
- [x] Step 3: Delivery method selection (local delivery, standard, expedited, pickup — pulled from config, not hardcoded)
- [x] Step 4: Payment — Stripe Elements (Payment Element) embedded, not a fake card form
- [x] Step 5: Review + place order (shows real order total from server-calculated cart)
- [x] Step indicator component (reusable, matches prototype style)
- [x] Post-payment: redirect to confirmation page showing real order number
- [x] Handle payment failure states gracefully (card declined, etc.)

**Done when:** A real (test-mode) Stripe payment completes and produces a real order record, confirmed via webhook (Backend Phase B5).

---

## Phase F5 — Quick Order & Reorder UI
**Goal:** Power-buyer flows for repeat business customers.

- [x] Quick order page: dynamic SKU + qty row grid, add/remove rows, inline validation (unknown SKU, out of stock)
- [x] "Add all to cart" with toast summary (added count, skipped count with reasons)
- [x] Reorder page: list of past orders, select one, shows line items with editable quantities, flags price/stock changes since original order
- [x] "Reorder all" adds adjusted cart to server cart

**Done when:** Both flows read/write against real order history and product data.

---

## Phase F6 — Account & Order History UI
**Goal:** Buyers can manage their profile and view past orders (not in original prototype, needed for a real system).

- [x] `/account` — profile info, saved addresses, business account details (tax-exempt status display)
- [x] `/account/orders` — order list with status badges, click into order detail
- [x] Order detail page: line items, totals, delivery status, reorder button

**Done when:** A buyer can self-serve view their order history without contacting support.

---

## Phase F7 — Admin Dashboard UI
**Goal:** Role-gated admin interface backed by real data (depends on Backend Phase B7).

- [x] Route-gate `/admin/*` to users with `role = admin` (checked both client-side for UX and server-side for security)
- [x] Dashboard home: metric cards (sales, pending orders, avg order value, new accounts) from real aggregated queries
- [x] Low-stock alerts panel (live from `inventory` table)
- [x] Top products panel (from real `order_items` aggregation)
- [x] Product management: create/edit product, manage price tiers, upload images (Supabase Storage)
- [x] Inventory management: adjust stock levels per warehouse
- [x] Order management: list orders, filter by status, update fulfillment status
- [x] Business account management: view/approve business accounts, tax-exemption flags

**Done when:** Admin can manage the full catalog, inventory, and order lifecycle without touching the database directly.

---

## Phase F8 — Polish & Accessibility
**Goal:** Production-quality UI.

- [x] Full responsive pass (mobile/tablet/desktop) on every page built above
- [x] Keyboard navigation + focus states on all interactive elements
- [x] ARIA labels on icon-only buttons, form fields, stock badges
- [x] Skeleton loaders replacing spinners where layout-shift matters
- [ ] Lighthouse pass (performance, accessibility, SEO) on storefront pages
- [ ] Cross-browser check (Chrome, Safari, Firefox)

**Done when:** Storefront pages score green on Lighthouse and pass a manual keyboard-only walkthrough.

---

## BACKEND

## Phase B0 — Infrastructure Setup
**Goal:** All external services provisioned and connected.

- [x] Create Supabase project, note connection strings, enable Postgres extensions needed (`pg_trgm` for search, `uuid-ossp`)
- [x] Create Clerk project, configure OAuth providers if desired, set up Organizations feature
- [x] Create Stripe account (test mode), get API keys, install Stripe CLI locally for webhook forwarding
- [x] Set up `.env.local` with all keys (Supabase URL/anon/service role, Clerk publishable/secret, Stripe publishable/secret/webhook secret)
- [x] Configure Vercel project with environment variables (separate for preview/production)
- [x] Set up Supabase CLI locally, link project, establish migration workflow

**Done when:** `supabase db push` and `next dev` both run clean with all services connected.

---

## Phase B1 — Database Schema & Migrations
**Goal:** Full schema exists as versioned SQL migrations.

Tables to create (in dependency order):

1. `business_accounts` — `id, clerk_org_id, company_name, billing_address_id, tax_exempt (bool), account_tier (business|individual), created_at`
2. `users` — `id, clerk_user_id, business_account_id (nullable), role (admin|buyer|staff), email, created_at`
3. `addresses` — `id, business_account_id, label, line1, line2, city, state, zip, is_default`
4. `categories` — `id, name, slug, description`
5. `warehouses` — `id, name, address_id`
6. `products` — `id, sku, name, category_id, description, image_url, pack_size, unit_count, is_active`
7. `price_tiers` — `id, product_id, min_cases, price_per_case_cents`
8. `inventory` — `id, product_id, warehouse_id, quantity_on_hand, low_stock_threshold`
9. `carts` — `id, user_id, created_at, updated_at`
10. `cart_items` — `id, cart_id, product_id, cases`
11. `orders` — `id, user_id, business_account_id, status (pending|paid|fulfilled|cancelled), subtotal_cents, shipping_cents, tax_cents, total_cents, stripe_payment_intent_id, delivery_method, shipping_address_id, created_at`
12. `order_items` — `id, order_id, product_id, cases, unit_price_cents_at_purchase`
13. `tax_rules` — `id, state_code, rate_percent`

- [x] Write each table as a numbered SQL migration file in `/supabase/migrations`
- [x] Add indexes: `products(sku)`, `products(category_id)`, full-text index on `products(name)`, `orders(user_id)`, `orders(status)`
- [x] Add foreign key constraints and `ON DELETE` behavior for every relation
- [x] Seed script: 10 categories, 18–50 demo products with tiers and inventory (port from prototype `PRODUCTS` array)
- [x] Generate TypeScript types from schema (`npm run db:types` — live public schema; regenerate after migrations)

**Done when:** Fresh `supabase db reset` + seed produces a fully populated dev database matching the prototype's demo catalog.

---

## Phase B2 — Auth Integration & RLS
**Goal:** Clerk identities are synced to Supabase, and Row-Level Security enforces data isolation.

- [x] Clerk webhook handler (`/api/webhooks/clerk`) for `user.created`, `user.updated`, `organization.created`, `organizationMembership.*` → upsert into `users` / `business_accounts` and link `users.business_account_id`
- [x] Middleware (`proxy.ts`) protecting `/checkout`, `/account/*`, `/admin/*`, and mutating APIs (`/api/cart`, `/api/checkout`, `/api/orders`, `/api/account`, `/api/admin`, `/api/quick-order`) — unauthenticated API calls return JSON 401
- [x] Supabase RLS policies:
  - `cart_items`/`carts`: user can only read/write their own cart
  - `orders`/`order_items`: user can only read/insert their own orders (or their business account's orders); admin role bypasses
  - `business_accounts`: user can only read/update their own account
  - `products`/`categories`/`inventory`: public read, admin-only write
- [x] Server-side role check helper (`lib/auth/requireRole.ts`) used in every admin API route in addition to RLS (defense in depth)
- [x] Test RLS policies directly against Supabase (not just through the app) to confirm they can't be bypassed (`npm run db:rls`)

**Done when:** A buyer authenticated via Clerk cannot read or mutate another business account's cart, orders, or account data — verified by direct API/DB tests.

---

## Phase B3 — Catalog API
**Goal:** Real product data served to the frontend.

- [x] `GET /api/products` — query params: `category`, `search`, `page`, `limit`; returns products with resolved price tiers and stock status
- [x] `GET /api/products/[sku]` — full product detail incl. all price tiers
- [x] `GET /api/categories` — list all categories
- [x] `lib/pricing.ts`: `resolveCasePrice(product, cases, accountTier)` — single source of truth, ported from prototype's `tierFor()`, used everywhere pricing is computed (catalog listing, product detail, cart, order creation)
- [x] Full-text/trigram search on `products.name` + exact/prefix match on `sku`
- [x] Stock status derived server-side from `inventory.quantity_on_hand` vs. `low_stock_threshold` (not stored redundantly)

**Done when:** Frontend Phase F2 works entirely against these endpoints with correct business/retail pricing per authenticated account.

---

## Phase B4 — Cart API
**Goal:** Server-persisted, price-safe cart.

- [x] `GET /api/cart` — returns current user's cart items with live-recalculated prices (never trust stored price on read)
- [x] `POST /api/cart/items` — add item `{product_id, cases}`, upsert if already present
- [x] `PATCH /api/cart/items/[id]` — update quantity
- [x] `DELETE /api/cart/items/[id]` — remove item
- [x] `POST /api/quick-order` — bulk add `[{sku, qty}]`, validates each SKU exists and is in stock, returns per-row success/failure for the toast summary
- [x] Cart total calculation (subtotal, shipping threshold logic, tax) centralized in `lib/pricing.ts`, shared with checkout

**Done when:** Cart state is identical across devices/sessions for the same logged-in user, and prices always reflect current tiers/account type — never client-supplied values.

---

## Phase B5 — Checkout & Stripe Integration
**Goal:** Real payments create real, correctly-priced orders.

- [x] `POST /api/checkout/create-intent`:
  1. Re-fetch cart server-side, re-resolve all prices (ignore any client-sent totals)
  2. Create `orders` row with `status = pending` and snapshot `order_items` with `unit_price_cents_at_purchase`
  3. Create Stripe Customer if the business account doesn't have one yet (store `stripe_customer_id`)
  4. Create Stripe PaymentIntent with `amount = order.total_cents`, `metadata.order_id`
  5. Return `client_secret` to frontend for Stripe Elements
- [x] `POST /api/webhooks/stripe` — **source of truth for order completion**:
  - `payment_intent.succeeded` → mark order `paid`, decrement `inventory.quantity_on_hand` per item, clear the cart, trigger confirmation email (Phase B7)
  - `payment_intent.payment_failed` → mark order `cancelled` or `payment_failed`, keep cart intact
  - Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- [x] Idempotency: webhook handler must be safe against Stripe's at-least-once delivery (check order status before mutating)
- [x] Tax calculation: `lib/pricing.ts` applies `tax_rules` by shipping state, skipped entirely if `business_account.tax_exempt = true`
- [x] Shipping cost calculation: free over threshold, flat rate otherwise (config-driven, not hardcoded in component)

**Done when:** A test-mode Stripe payment reliably produces a `paid` order with correct snapshot pricing, decremented inventory, and no way for the client to manipulate the charged amount.

---

## Phase B6 — Orders & Reorder API
**Goal:** Order history and reorder logic.

- [x] `GET /api/orders` — current user's (or business account's) order history, paginated
- [x] `GET /api/orders/[id]` — order detail with line items
- [x] `GET /api/orders/[id]/reorder` — returns line items re-validated against current stock and current pricing, flags any SKU that's now out of stock or changed price
- [x] Order status transitions restricted to valid state machine (`pending → paid → fulfilled`, or `→ cancelled`) enforced server-side, not just in UI

**Done when:** Reorder flow (Frontend F5) always reflects current catalog truth, never stale snapshot data silently.

---

## Phase B7 — Admin API
**Goal:** Full backend support for the admin dashboard.

- [x] `GET /api/admin/metrics` — sales totals (rolling window), pending order count, avg order value, new business account count (all computed via SQL aggregation, materialized view if performance requires it later)
- [x] `GET /api/admin/inventory/low-stock` — products at/below threshold
- [x] `GET /api/admin/products/top` — top sellers by cases sold, from `order_items` aggregation
- [x] Product CRUD: `POST/PATCH/DELETE /api/admin/products`, including price tier management
- [x] `POST /api/admin/products/[id]/image` — image upload to Supabase Storage (`product-images` bucket), returns public URL
- [x] Inventory adjustment: `PATCH /api/admin/inventory/[id]`
- [x] Order management: `GET /api/admin/orders` (all orders, filterable by status), `PATCH .../status`
- [x] Business account management: `GET /api/admin/business-accounts`, `PATCH .../tax-exempt`
- [x] Every admin route double-checks `role = admin` server-side (never trust RLS alone for admin-sensitive aggregate reads that might bypass row-level scoping)
- [x] Email integration (Resend): order confirmation on `payment_intent.succeeded`, low-stock alert to `ADMIN_ALERT_EMAIL` on threshold breach

**Done when:** Frontend Phase F7 runs entirely on real data with no mock arrays remaining.

---

## Phase B8 — Hardening & Observability
**Goal:** Production readiness.

- [x] Sentry wired into frontend and API routes (`withSentryConfig`, `onRequestError`, webhook/API `captureException`, error-only session replay). Set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` in preview/production; optional `SENTRY_AUTH_TOKEN` for source maps.
- [x] Rate limiting on public search (`/api/products?search=`) and Clerk/Stripe webhooks — Upstash Redis or in-memory fallback
- [x] Structured logging on all webhook handlers (Stripe, Clerk) — `logInfo` / `logError` (Sentry breadcrumbs + `captureException`)
- [x] Automated tests:
  - Unit tests on `lib/pricing.ts` (tier boundaries, business vs retail, tax-exempt cases) — highest priority, highest cost-of-bug area
  - [x] Integration tests on checkout flow using Stripe test clocks/test cards (`npm run test:integration`, skipped unless `STRIPE_SECRET_KEY` is `sk_test_`)
  - [x] RLS policy tests (attempt cross-account reads, expect denial) — `npm run db:rls`
- [x] Load-test script for catalog search and admin metrics (`npm run load:test` against `LOAD_TEST_BASE_URL`, default localhost)
- [x] Backup/retention + staging checklist in `docs/operations.md` (and `.env.preview.example`)

**Done when:** Core money-path logic (pricing, checkout, webhooks) has test coverage, and failures anywhere in the Stripe/Clerk webhook chain are visible in Sentry/logs, not silent.

---

## Fast-Follow / Backlog (post-MVP)

- Net-30 invoicing for approved business accounts (Stripe Invoicing API)
- Multi-warehouse inventory routing (currently schema supports it, UI/logic for warehouse selection at checkout is deferred)
- Saved carts / favorites lists per buyer
- CSV bulk import for quick order and admin product upload
- Role-based staff accounts within a business account (beyond single admin/buyer split)
- Analytics dashboard beyond basic admin metrics (cohort/retention, category trends)

---

## Milestone Summary

| Milestone | Frontend Phases | Backend Phases | Demoable Result |
|---|---|---|---|
| 1 | F0–F1 | B0–B2 | Auth-gated shell, real sign-up/sign-in |
| 2 | F2 | B3 | Browse real catalog with correct tiered pricing |
| 3 | F3 | B4 | Server-persisted cart |
| 4 | F4 | B5 | Real Stripe test-mode checkout end-to-end |
| 5 | F5–F6 | B6 | Quick order, reorder, order history |
| 6 | F7 | B7 | Full admin dashboard on real data |
| 7 | F8 | B8 | Production-hardened, tested, launch-ready |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
