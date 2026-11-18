# Attest — what we built

A B2B testimonial exchange: businesses collect verified testimonials from their own
customers, and — when they have none yet — review each other to bootstrap proof.

---

## 1. The problem it solves

1. **Collection is manual.** Happy customers exist, but asking for and formatting reviews is work.
2. **Cold start.** A new product has no customers to ask, so its wall is empty.
3. **Trust.** Anonymous quotes are worthless; you need identity, consent, and owner approval.

Attest answers all three: a collection link, an approval inbox, a hosted wall, and a
credit-based exchange so new products can earn reviews from peers.

---

## 2. The three surfaces

### A. Public site
| Page | Route | Purpose |
| --- | --- | --- |
| Landing | `/` | Positioning, live proof (recent approved public testimonials), marketplace preview, embed demo |
| Explore | `/explore` | Marketplace of public products accepting testimonials; filter by search/category |
| Product page | `/product/[slug]` | A product's page where a signed-in reviewer submits an exchange review (earns credits) |
| Public wall | `/wall/[slug]` | The hosted testimonial wall; supports `embed=1`, `layout`, `theme`, `accent`, `limit`, `cta=0` |
| Collect form | `/collect/[slug]` | No-login customer submission form (this is the link you send customers) |

### B. Owner dashboard (authenticated)
| Tab | Route | What the owner does |
| --- | --- | --- |
| Overview | `/dashboard` | Product summary, credits, collection + wall links, latest submissions |
| Inbox | `/dashboard/inbox` | Approve / reject pending reviews (pending, approved, rejected tabs) |
| Product | `/dashboard/product` | Name, description, website, category, logo (PNG/JPG/WebP ≤ 512 KB), public + accepting toggles |
| Wall | `/dashboard/wall` | Layout, light/dark, brand accent, card limit, live preview, copy-paste embed snippet, reorder approved reviews |
| Credits | `/dashboard/credits` | Balance, ledger, "request a testimonial" (−1 credit) |
| Admin | `/admin` | Platform admin: moderate any testimonial, restrict/unrestrict users |

### C. Embeds & API
| Thing | Location | Notes |
| --- | --- | --- |
| Script widget | `/widget.js` | `data-product`, `data-layout` (wall/grid/carousel/badge/float), `data-theme`, `data-accent`, `data-limit`, `data-container` |
| Iframe widget | `/wall/[slug]?embed=1&…` | Same options via query params |
| Public JSON | `GET /api/v1/widget/[slug]` | Approved-only, CORS `*`, `s-maxage=60, stale-while-revalidate=300` |
| Health | `GET /api/health` | DB probe; `200` healthy, `503` unhealthy |
| Logo proxy | `GET /api/logos/[key]` | Serves uploaded logos |

---

## 3. Core flows

### Collect a customer review
```
/collect/<slug> → consent + rating + text (min 100 chars)
  → status "pending" → owner approves in /dashboard/inbox
  → visible on /wall/<slug>, the widget, and the public API
```

Rules enforced server-side:
- one review per reviewer per product (unique `product_id + author_id`)
- consent required, anti-bot via Cloudflare Turnstile (bypassed in dev without keys)
- owner cannot review their own product
- product must be public and `accepting_testimonials`
- restricted users are blocked

### Exchange review (credit economy)
```
reviewer opens /product/<slug> → submits → +5 credits (CREDITS_PER_REVIEW)
owner spends 1 credit (CREDITS_PER_REQUEST) on /dashboard/credits to open a request
the next exchange review on that product fulfils the request
```

Credit ledger rules: every movement writes `credit_transactions` with `balance_after`,
amounts can never be zero, balances can never go negative (DB check constraints), and a
review/request can only be credited/charged once (unique indexes).

### Identity
- **LinkedIn OIDC** (`openid profile email`) via `/api/auth/linkedin/start` → `/callback`.
  PKCE is intentionally *not* used on LinkedIn's web endpoint (it rejects `code_verifier`);
  the ID token is validated for issuer, audience, expiry, and nonce when present.
- **Demo sign-in** (enable only with `ALLOW_DEMO_AUTH=true`) for local testing.
- Each testimonial stores an immutable **identity snapshot** (name, headline, source,
  avatar, profile URL) taken at submission time, so later profile changes don't rewrite history.
- Sessions: random 32-byte token in an httpOnly cookie, SHA-256 hashed in `sessions`,
  30-day TTL, HMAC-signed OAuth state cookie (10 min).

---

## 4. Architecture

```
Next.js 16 (App Router, React 19, server actions)
├─ src/app/…            routes, server components, actions
├─ src/components/…     widget UI, forms, customizer (client components)
├─ src/lib/…            db, auth, linkedin, credits, identity, validate, urls, uploads, email
├─ public/widget.js     dependency-free embed script (own scoped CSS)
└─ scripts/             demo seed
Drizzle ORM → Postgres (Neon, pooled connection; pg Pool with @vercel/functions attach on Vercel)
```

- **Mutations** are Next.js server actions (`src/app/actions/*`), not REST; every action
  re-authenticates with `requireUser()` and re-checks ownership inside a transaction.
- **Reads** for pages go through `src/lib/queries.ts`; the widget API is the only public read surface.
- **Rendering**: dashboard and wall are `force-dynamic`; approved-item writes call
  `revalidatePath` so walls and embeds refresh immediately (edge caches ~60 s).
- **Uploads** are stored on disk (`.data/uploads/logos` locally, `/tmp` on Vercel) and served
  through `/api/logos/[key]` after magic-byte validation.
- **Email**: Resend when `RESEND_API_KEY` is set, otherwise a console mock in development
  (owner notified on submission, reviewer notified on approval).

---

## 5. Data model

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `users` | Accounts | unique email; unique `(provider, provider_subject)`; `is_admin`, `is_restricted` |
| `sessions` | Login sessions | FK user, cascade delete |
| `products` | One product per owner | unique `owner_id`, unique `slug` |
| `testimonials` | Reviews + identity snapshot | unique `(product_id, author_id)`; status enum; display order |
| `credit_transactions` | Ledger | non-zero amount, non-negative balance, unique per review/request |
| `testimonial_requests` | Open exchange requests | `open`/`fulfilled`; one testimonial fulfils one request |
| `audit_events` | Admin/moderation trail | actor, action, target, reason |

Testimonial statuses: `pending → approved | rejected`, plus `withdrawn` (by the author).
Only `approved` appears publicly; `withdrawn` always wins over a replayed approval.

---

## 6. Security posture

- All public reads filter to `status = approved AND products.is_public`.
- Slug is a public identifier — nothing sensitive belongs in product name/description.
- No write access over the public API; admin actions are authenticated server actions.
- ID token validation, HMAC-signed OAuth state, `safeNextPath` open-redirect guards,
  same-origin framing except embeddable walls, `nosniff`, referrer policy, HSTS in production.
- Rate limiting is **not** implemented; Turnstile is the anti-bot gate.

---

## 7. Current state & known gaps

| Area | Status |
| --- | --- |
| Database | Migrating SQLite → Neon Postgres. Needs `DATABASE_URL`; a stale pooled host causes `ENOTFOUND` until `neon env pull` re-runs |
| Demo data | `scripts/seed-airlinecabz-demo.mjs` (Postgres) must run after `DATABASE_URL` is set |
| LinkedIn | Sign-in works; headline and public profile URL are unavailable from LinkedIn's OIDC API, so they stay `null` |
| Email | Mock unless `RESEND_API_KEY` is configured |
| Admin | Basic moderation + user restriction; no analytics |
| Reviews per product | One per reviewer per product, forever (no re-review flow) |
| Search | Explore filters in memory; no pagination strategy yet |

---

## 8. Repo map (docs)

| Doc | Use |
| --- | --- |
| `docs/INTEGRATION.md` | How to connect the wall/API to any site |
| `docs/AGENT-PROMPT.md` | Copy-paste prompt so an agent can do the integration |
| `docs/CLIENT-DEMO.md` | How to present this to a client (fast + slow script) |
| `docs/PRODUCT.md` | This document |

### Running locally

```bash
npm run dev                                  # http://localhost:3000
node --env-file=.env.local scripts/seed-airlinecabz-demo.mjs
open http://localhost:3000/airlinecabz-demo.html
```
