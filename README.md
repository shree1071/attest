# Attest — B2B Testimonial Exchange Platform

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

```
                      ┌──────────────────────────────────────┐
                      │        Product Management            │
                      │  Create Profile · Slugs · Logo Asset │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  Method 1: Direct     │                       │  Method 2: Marketplace │
     │  Customer Collection  │                       │  Community Exchange   │
     │  (/collect/[slug])    │                       │  (/product/[slug])    │
     │  • Free forever       │                       │  • Reviewer gets +5 cr│
     │  • No credit cost     │                       │  • Owner spends 1 cr  │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Identity Snapshot Generation      │
                      │  Capture Name, Avatar, Headline, &   │
                      │  Provider Provenance into JSON Record│
                      └──────────────────┬───────────────────┘
                                         ▼
                      ┌──────────────────────────────────────┐
                      │       Owner Moderation Inbox         │
                      │   /dashboard/inbox (Pending Reviews) │
                      └───────┬──────────────────────┬───────┘
                              │                      │
                     [Approve]│                      │[Reject]
                              ▼                      ▼
                 ┌────────────────────────┐    ┌────────────────────────┐
                 │  Public Wall & Embed   │    │  Private Rejection     │
                 │  (/wall/[slug])        │    │  • Hidden from public  │
                 │  • Iframe & Direct Link│    │  • Credit kept (unless │
                 │  • Sanitize & CSP Safe │    │    flagged for abuse)  │
                 └────────────────────────┘    └────────────────────────┘
```

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
* **Curated Wall (`/wall/[slug]`)**: Displays only approved testimonials in a clean multi-column card layout with verified identity badges.
* **Zero-Dependency Iframe Embed (`/wall/[slug]?embed=1`)**: Copy-paste responsive embed snippet for Webflow, Framer, WordPress, or custom HTML without loading bulky third-party tracking scripts.
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

# Optional: Add when ready to test real LinkedIn OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The SQLite database is created automatically at `.data/app.db` on first request with all Drizzle migrations applied.

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

- [ ] **Advanced Wall of Love Styles**: Masonry grid (`columns-3`), star ratings (1–5), and dark/light theme embed parameters (`?theme=dark`).
- [ ] **Carousel & Badge Widgets**: Horizontal slider and floating badge widgets (Senja / Endorsal parity).
- [ ] **Supabase PostgreSQL Driver**: Switch from SQLite to Supabase Postgres with Row Level Security (RLS) for multi-tenant cloud hosting.
- [ ] **Supabase Storage**: Migrate logo storage from local disk (`.data/uploads/logos`) to an S3-compatible Supabase bucket.
- [ ] **Transactional Email Notifications**: Integrate [Resend](https://resend.com) to notify founders when new testimonials are submitted.
- [ ] **Centralized `/admin` Governance**: Platform moderator queue for cross-product review auditing and reviewer suspensions.

---

## License

ISC License. Built for bootstrapped founders and makers.
