# Attest

A small B2B testimonial exchange: collect text testimonials from your own customers for free, earn credits by reviewing other products, and publish approved testimonials on a public wall or iframe embed.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional; sensible defaults apply
npm run dev
```

Open http://localhost:3000. The SQLite database is created at `.data/app.db` on first request; migrations in `drizzle/` run automatically.

### Demo sign-in

Without LinkedIn credentials the app offers email-based demo sign-in (no password). This is gated by `ALLOW_DEMO_AUTH`, which defaults to **on outside production**. Set `ALLOW_DEMO_AUTH=false` to hide it.

Demo sign-in exists to exercise the product locally. It is not an identity check and must not be used to claim verified identity.

## LinkedIn sign-in

1. Create a LinkedIn app and request **Sign In with LinkedIn using OpenID Connect**.
2. Register this callback URL in LinkedIn: `https://<your-host>/api/auth/linkedin/callback`
3. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` (never commit these).
4. Set `NEXT_PUBLIC_APP_URL` to the deployed origin so wall/embed URLs are absolute.

The flow uses the authorization code grant with PKCE, `state` and `nonce` validation, and verifies the `id_token` audience, expiry and nonce. Only `openid`, `profile` and `email` are requested.

Wording in the UI says **"Signed in with LinkedIn"**, never "verified" — LinkedIn OIDC proves authentication at a point in time, not identity verification.

## Identity snapshots

At submission, the server builds a JSON snapshot from the session user (name, headline + provenance, profile URL, avatar URL, provider subject, observation and submission timestamps, schema version). The public wall renders only that snapshot and never calls LinkedIn. A later login updates the mutable user profile only; existing testimonials keep their snapshot.

## Credits

- Ledger-only balance: `SUM(credit_transactions.amount)`. No mutable balance column.
- One exchange testimonial = `+5`; one marketplace request = `-1`.
- Idempotency: unique indexes on `reference_testimonial_id` and `reference_request_id`; `CHECK(amount <> 0)` and `CHECK(balance_after >= 0)`.
- Writes run in `BEGIN IMMEDIATE` transactions, so a spend cannot race past the balance check.
- Self-reviews, duplicate submissions per product and duplicate credit awards are rejected server-side.
- Rejecting a testimonial does not reverse credits; that is an explicit fraud/abuse decision, not automatic.
- Author withdrawal also keeps earned credits but permanently removes the review from the wall. The unique submission row remains, so a withdrawn review cannot be replayed for more credits.

## Moderation and withdrawal

The owner sees pending, approved and rejected submissions and can approve, reject or unpublish any of them. An author can withdraw their own testimonial from the product or collection page; withdrawal immediately removes it from the wall and keeps a `withdrawnAt` audit timestamp. Owners cannot re-approve a withdrawn entry.

## Security notes

- Session tokens are random 256-bit values, stored only as SHA-256 hashes in the database, in an HttpOnly SameSite=Lax cookie.
- LinkedIn OIDC uses PKCE, signed `state`, a required `nonce`, and validates the ID token issuer, audience and expiry. The client secret is server-only.
- Redirect targets are restricted to local paths; backslashes and control characters are rejected.
- Credit balance and moderation are enforced in server actions, never in the browser.
- Middleware sets `frame-ancestors 'self'` on app/dashboard pages and `frame-ancestors *` only on `/wall/*`, so only walls are embeddable.
- Logos are magic-byte sniffed, size limited, served with `nosniff`, and never trusted as SVG.

## Tests

```bash
npm test
```

The suite runs against a temporary SQLite database and covers ledger invariants (no overdraft, idempotent awards and spends), validation, redirect safety and embed escaping.

## Known MVP limitations

- No transactional email. New submissions are surfaced by the dashboard pending badge and inbox.
- One product per account; changing a slug does not redirect old URLs.
- One testimonial per person per product, including after withdrawal.
- Demo sign-in is for local testing only and must stay disabled in production.
- Rate limiting and multi-account fraud detection are not implemented; LinkedIn sign-in plus the per-product uniqueness constraint is the current abuse boundary.

## Data and portability

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | LinkedIn sign-in, demo sign-in |
| `/explore` | Marketplace of products accepting testimonials |
| `/product/[slug]` | Public product page + exchange submission |
| `/collect/[slug]` | Free customer collection form |
| `/wall/[slug]` | Public wall (approved only), `?embed=1` for iframe |
| `/dashboard` | Overview, share links, credits |
| `/dashboard/inbox` | Pending / approved / rejected moderation |
| `/dashboard/product` | Product profile, logo, slug, availability |
| `/dashboard/wall` | Ordering, unpublish, copy wall URL + embed code |
| `/dashboard/credits` | Balance, request a testimonial, ledger |

## Data and portability

The schema (`src/lib/schema.ts`) is Drizzle and deliberately SQLite-portable: text columns with CHECK constraints instead of native enums, JSON stored as text, ledger references as unique text columns. Moving to Postgres/Supabase means switching the driver and regenerating migrations; the query layer and business rules stay the same. Row-level security would be added at that point — today authorization is enforced in server actions via the session user and ownership checks.

Uploaded logos live under `.data/uploads/logos` and are served by `/api/logos/[key]` with validated filenames. Swap `src/lib/uploads.ts` for object storage when deploying.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build + type check
npm start          # serve production build
npm run db:generate # regenerate migration from schema changes
```
