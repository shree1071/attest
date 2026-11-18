# Attest — B2B Testimonial Exchange Platform

[![CI](https://github.com/shree1071/attest/actions/workflows/ci.yml/badge.svg)](https://github.com/shree1071/attest/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=flat)](https://orm.drizzle.team)
[![Tests](https://img.shields.io/badge/Tests-8%20Passed-emerald?style=flat)]()
[![License](https://img.shields.io/badge/License-ISC-zinc?style=flat)]()

**Attest** is a customer-ready B2B testimonial exchange and social proof platform engineered for early-stage SaaS founders, bootstrapped makers, and indie hackers. It solves the critical cold-start trust problem during go-to-market launches by pairing free direct customer testimonial collection with a fair, community-powered review exchange marketplace.

> **Core Value Proposition**: *Give 1 testimonial. Get 5 back.*

---

## Table of Contents

- [Core Principles](#core-principles)
- [System Architecture & Data Flow](#system-architecture--data-flow)
- [Key Features](#key-features)
  - [1. User Onboarding & Product Profiles](#1-user-onboarding--product-profiles)
  - [2. Dual Collection Engine](#2-dual-collection-engine)
  - [3. LinkedIn OIDC & Immutable Identity Snapshots](#3-linkedin-oidc--immutable-identity-snapshots)
  - [4. Append-Only Credit Ledger](#4-append-only-credit-ledger)
  - [5. Public Wall & Lightweight Embed Widget](#5-public-wall--lightweight-embed-widget)
- [Data Model & Integrity Invariants](#data-model--integrity-invariants)
- [Security & Compliance Highlights](#security--compliance-highlights)
- [Route Directory](#route-directory)
- [Quickstart & Local Setup](#quickstart--local-setup)
- [Automated Testing](#automated-testing)
- [Roadmap & Migration to Cloud](#roadmap--migration-to-cloud)

---

## Core Principles

1. **Text-First & Minimal**: High-impact text testimonials without the friction, weight, or cost of video/audio hosting.
2. **Free Forever for Customer Collection**: Zero credit deductions or exchange requirements for reviews collected from your actual customers.
3. **Double-Entry Append-Only Ledger**: No mutable balance fields. Credits are tracked as transaction rows with atomic balance checks and zero overdraft tolerance.
4. **Decoupled Identity Snapshots**: Attribution is permanently frozen at submission time, ensuring walls remain intact even if a reviewer's LinkedIn profile changes or is deleted.
5. **Full Editorial Ownership**: Product owners maintain complete authority over what is published; rejected submissions never reach the public wall.
6. **No Fake Reviews or Self-Dealing**: Server-side enforcement prohibits self-reviews, duplicate submissions, and credit replay farming.

---

## System Architecture & Data Flow

```mermaid
flowchart LR
    subgraph Actors["Actors"]
        Owner["Owner / Reviewer\n(browser)"]
        Admin["Admin\n(moderation queue)"]
        Visitor["Visitor\n(client site)"]
        Uptime["Uptime Monitor\n(external)"]
    end

    subgraph Cloudflare["Cloudflare Account (Client-Owned)"]
        WebApp["Web App: Next.js on Workers\n(pages, forms, auth, admin, API)"]
        Hyperdrive["Hyperdrive\n(connection pooling)"]
        Turnstile["Turnstile\n(spam check)"]
        Widget["Widget: static script + cached API\n(~60s edge cache)"]
        Backup["Daily Backup Job\n(export)"]
    end

    subgraph External["External Services & Storage"]
        LinkedIn["LinkedIn OAuth\n(OIDC)"]
        Neon["Neon Postgres\n(users, sites, reviews, widgets)"]
        BackupStorage["Backup Storage\n(encrypted)"]
    end

    Owner -- "sign in, submit, review" --> WebApp
    Admin -- "role-checked /admin" --> WebApp
    Visitor -- "script + cached data" --> Widget
    Uptime -- "health check" --> WebApp

    WebApp -- "OAuth sign-in" --> LinkedIn
    WebApp -- "verify token" --> Turnstile
    WebApp -- "read / write" --> Hyperdrive
    Hyperdrive --> Neon

    Widget -. "cache miss only" .-> Neon
    Neon -- "daily export" --> Backup
    Backup -- "encrypted push" --> BackupStorage
```

### High-Level Component Mapping

1. **Next.js on Cloudflare Workers**: Edge runtime hosting for SSR pages, Server Actions, OAuth callbacks, and API routes.
2. **Cloudflare Hyperdrive & Neon Postgres**: Scalable serverless PostgreSQL with global connection pooling and zero cold-start bottlenecks.
3. **Cloudflare Turnstile**: Zero-friction bot protection on review submissions and authentication forms.
4. **Edge-Cached Widget & Script (`~60s cache`)**: Ultra-fast `<script src="/widget.js">` and `/api/v1/widget/[slug]` endpoint ensuring client websites load social proof in <50ms without hitting the primary database.
5. **Uptime Monitoring & Health Probe**: Live `/api/health` checking node availability and database connectivity.
6. **Automated Daily Backups**: Scheduled encrypted database exports to off-site cloud storage.

---

## Key Features

### 1. User Onboarding & Product Profiles
* **Single or Multi-Account Management**: Sign in via LinkedIn OpenID Connect (OIDC) or instantaneous Demo Auth for local development.
* **Custom Slug & Branding**: Configure product name, 20–600 character pitch, categories (SaaS, DevTools, AI, Design, etc.), website URLs, and unique public slugs (`/wall/your-product`).
* **Secure Asset Handling**: Drag-and-drop logo uploads with automatic magic-byte sniffing (PNG, JPEG, WebP) and 10 MB Server Action payload configurations.

### 2. Dual Collection Engine
* **Method 1: Direct Customer Collection (`/collect/[slug]`)**: Send a personalized link to existing users. Customers sign in, submit their review, and agree to publication terms without spending or earning credits.
* **Method 2: Community Testimonial Exchange (`/explore` & `/product/[slug]`)**: Discover other indie products, write an authentic review, and instantly earn **5 exchange credits** to request reviews for your own product.

### 3. LinkedIn OIDC & Immutable Identity Snapshots
* Uses the **Sign In with LinkedIn using OpenID Connect** standard (scopes: `openid`, `profile`, `email`) with PKCE, `state`, and `nonce` cryptographic checks.
* **UI Transparency**: Accurately styled as *"Signed in with LinkedIn"* (never marketed with misleading claims like "LinkedIn Certified").
* **Immutable Snapshotting**: Creates an isolated JSON snapshot (`identitySnapshot`) at the exact millisecond of submission containing:
  * Display name and verified provider subject
  * Profile avatar reference
  * Headline and provenance (`self_reported` vs. `linkedin`)
  * Observation and submission timestamps
  * Schema versioning
  * Consent confirmation
* *Result*: Historical testimonials survive reviewer account changes, suspensions, or profile updates without external runtime API dependencies.

#### LinkedIn app setup (Vercel + custom domain)
LinkedIn compares `redirect_uri` **byte for byte** against the values registered on the app, so every host the app runs on must be registered:

| Environment | Authorized redirect URL |
|---|---|
| Production (Vercel) | `https://attest26.vercel.app/api/auth/linkedin/callback` |
| Local development | `http://localhost:3000/api/auth/linkedin/callback` |
| Custom domain | `https://your-domain.com/api/auth/linkedin/callback` |

Steps:
1. LinkedIn Developer Portal → your app → **Auth** → *Authorized redirect URLs for your app* → add the exact URLs above (no query strings or fragments).
2. Vercel → Project → Settings → Environment Variables: set `NEXT_PUBLIC_APP_URL=https://attest26.vercel.app` (Production) and keep `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`. Redeploy after changing any env value.
3. Optional: set `LINKEDIN_REDIRECT_URI` to pin the one canonical callback LinkedIn should always receive, even when the request arrives on a preview or custom host.
4. The app derives the callback from `NEXT_PUBLIC_APP_URL`, then Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, then the request host — so preview deployments do not invent an unregistered redirect URL.

> Symptom of a mismatch: LinkedIn shows *"Bummer, something went wrong — The redirect_uri does not match the registered value"* and the `redirect_uri` query parameter in the address bar will show the exact value that must be registered.

### 4. Append-Only Credit Ledger
* No mutable `balance` integer columns that risk concurrency drift or race conditions.
* Credit balance is strictly computed as `SUM(credit_transactions.amount)`.
* Every exchange submission writes a transactionally atomic record inside a `BEGIN IMMEDIATE` boundary:
  * `amount = +5` for reviews given (`transaction_type: 'earned'`)
  * `amount = -1` for reviews requested (`transaction_type: 'spent'`)
* Database-level checks guarantee:
  * `CHECK(amount <> 0)`
  * `CHECK(balance_after >= 0)` (Impossible to overdraft)
  * Unique indexes on `reference_testimonial_id` preventing duplicate credit issuance.

### 5. Public Wall & Lightweight Embed Widget
* **Curated Wall (`/wall/[slug]`)**: Displays only approved testimonials as floating, borderless cards with an average rating, verified identity badges and a persistent "Leave a testimonial" action.
* **Zero-Dependency Iframe Embed (`/wall/[slug]?embed=1`)**: Copy-paste responsive embed snippet for Webflow, Framer, WordPress, or custom HTML without loading bulky third-party tracking scripts.
* **Widget Options**: `/dashboard/wall` offers a live-preview builder — layout (`wall` masonry, `grid`, `carousel`, `badge`, `float`), theme (`light` / `dark`), accent colour (`accent=%23rrggbb`) and item count (`limit=N`).
* **Script Widget (`/widget.js`)**: `data-product` (slug, required), `data-layout`, `data-theme`, `data-accent`, `data-limit`, `data-container`. The `float` layout renders a fixed bottom-right social-proof bubble that expands into a card panel, independent of any iframe.
* **Security Middleware**: Custom proxy headers enforce `frame-ancestors *` exclusively on `/wall/*` while locking all other app and dashboard routes to `frame-ancestors 'self'`.

---

## Data Model & Integrity Invariants

The schema is built with [Drizzle ORM](https://orm.drizzle.team) and designed to be effortlessly portable from SQLite to PostgreSQL / Supabase:

| Table | Responsibility | Constraints & Invariants |
|---|---|---|
| `users` | Account identity and profile provenance | `UNIQUE(email)`, `UNIQUE(provider, provider_subject)` |
| `sessions` | HttpOnly session token storage | Cascade delete on user removal, SHA-256 hashed IDs |
| `products` | Product profile, slug routing, and logo | `UNIQUE(owner_id)`, `UNIQUE(slug)` |
| `testimonials` | Content, moderation state, and JSON snapshot | `UNIQUE(product_id, author_id)` (Anti-farming: 1 review per user/product) |
| `credit_transactions` | Append-only ledger of all credit events | `UNIQUE(reference_testimonial_id)`, `CHECK(balance_after >= 0)` |
| `testimonial_requests` | Open requests created by product owners | `UNIQUE(fulfilled_testimonial_id)` |

---

## Security & Compliance Highlights

- **Session Security**: Session tokens are 256-bit cryptographically secure random values stored as SHA-256 hashes in `HttpOnly`, `SameSite=Lax` cookies.
- **Server Action Protection**: File uploads and form submissions execute via Next.js Server Actions with configured 10 MB payload limits and server-side validation.
- **Strict Redirect Validation**: OAuth redirect paths are restricted strictly to internal paths; backslashes, CRLF, and external host redirects are rejected.
- **Safe Asset Serving**: Logos are sniffed via magic bytes, limited to 512 KB, served with `X-Content-Type-Options: nosniff`, and SVGs are rejected to eliminate stored XSS vectors.
- **CSP & Iframe Isolation**: Only walls can be framed; sensitive dashboard, inbox, and settings routes block external embedding.

---

## Route Directory

### Public Routes
* `/` — Platform landing page and value overview
* `/explore` — Marketplace of products accepting testimonial exchanges
* `/product/[slug]` — Product profile and community exchange submission form
* `/collect/[slug]` — Free customer testimonial submission form
* `/wall/[slug]` — Public testimonial wall (add `?embed=1` for responsive iframe)
* `/login` — LinkedIn sign-in and local demo login

### Founder Dashboard
* `/dashboard` — Overview metrics, shareable URLs, and credit status
* `/dashboard/product` — Manage product name, description, website URL, and logo
* `/dashboard/inbox` — Review pending submissions; approve or reject
* `/dashboard/wall` — Live embed preview, copy embed code, and reorder published testimonials
* `/dashboard/credits` — Ledger history, current balance, and request new testimonials

---

## Quickstart & Local Setup

### Prerequisites
* Node.js v20+ (tested on Node v22.14 LTS)
* npm or bun

### 1. Clone & Install
```bash
git clone https://github.com/shree1071/attest.git
cd attest
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Default `.env.local` settings:
```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOW_DEMO_AUTH=true

# Postgres (Neon pooled connection string)
DATABASE_URL=postgres://user:password@host/db?sslmode=require

# Optional: Add when ready to test real LinkedIn OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

Apply the Drizzle migrations once the connection string is set:
```bash
npm run db:migrate
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Demo mode (no database required)
For demos, laptop demos and offline work there is a bundled, seeded database
(PGlite — real Postgres semantics, in-memory):
```bash
npm run dev:demo
```
This sets `ATTEST_DEMO_DB=1`, serves demo products, walls, an inbox with one
pending review and a 9-credit ledger, then reseeds on every restart. Sign in
with the demo form as `demo@attest.app` to reach the owner dashboard.

Demo mode is explicit and never replaces Postgres: it is used only when
`ATTEST_DEMO_DB=1` is set or `DATABASE_URL` is missing. If Neon is unreachable,
the real connection error is surfaced as before.

### 4. Production Build
```bash
npm run build
npm start
```

---

## Automated Testing

Attest includes an invariant and security test suite using the Node.js native test runner:

```bash
npm test
```

### Test Coverage:
1. **Ledger Invariants**: Ensures credit balance is calculated strictly from ledger transactions and never drops below zero.
2. **Idempotency**: Proves an exchange request cannot be double-charged or re-awarded.
3. **Input Sanitization**: Tests whitespace trimming and character boundary enforcement (100–5,000 characters).
4. **Email & URL Normalization**: Validates RFC compliance, domain structure, and credential stripping.
5. **Slug Generation**: Enforces URL-safe, lowercase alphanumeric format.
6. **Redirect Protection**: Confirms redirect handlers cannot be coerced into off-site phishes.
7. **Embed Escaping**: Verifies iframe embed snippets sanitize all dynamic attributes.

---

## Roadmap & Migration to Cloud

- [x] **Advanced Wall of Love Styles**: Floating masonry wall (`columns-3`), star ratings (1–5), average rating summary, dark/light theme and accent colour parameters (`?theme=dark&accent=%23rrggbb`).
- [x] **Carousel, Badge & Floating Widgets**: Horizontal slider, compact rating badge, and a fixed bottom-right floating bubble widget rendered by `/widget.js`.
- [ ] **Supabase PostgreSQL Driver**: Switch from SQLite to Supabase Postgres with Row Level Security (RLS) for multi-tenant cloud hosting.
- [ ] **Supabase Storage**: Migrate logo storage from local disk (`.data/uploads/logos`) to an S3-compatible Supabase bucket.
- [ ] **Transactional Email Notifications**: Integrate [Resend](https://resend.com) to notify founders when new testimonials are submitted.
- [ ] **Centralized `/admin` Governance**: Platform moderator queue for cross-product review auditing and reviewer suspensions.

---

## License

ISC License. Built for bootstrapped founders and makers.
