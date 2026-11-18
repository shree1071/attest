# Connecting Attest reviews to your site

Attest gives you a hosted testimonial wall plus three ways to put it on any website:
a drop-in `<script>`, an `<iframe>`, or a plain JSON API.

Everything below is read-only and public: only **approved** testimonials for a **public**
product are ever served.

---

## 0. Prerequisites

You need two things:

1. **A base URL** — where Attest is running (`http://localhost:3000` in development,
   your deployed domain in production).
2. **A product slug** — the short id used in URLs, e.g. `airline-cab`.
   Open **Dashboard → Product**; the slug is shown next to your collection link
   (`/collect/<slug>`) and wall link (`/wall/<slug>`).

Only one product per account is supported today: `products.owner_id` is unique.

---

## 1. Pick an integration path

| Path | Best for | Effort |
| --- | --- | --- |
| `<script>` embed | Marketing sites, WordPress, Webflow, plain HTML | 1 line |
| `<iframe>` embed | Locked-down CSP sites, page builders | 1 line |
| JSON API | Custom React/Next/Vue components, mobile apps, server rendering | ~20 lines |

All three read the same data and update automatically after moderation.

---

## 2. Path A — script embed (recommended)

Paste this where the reviews should appear (the script appends the widget to its own
parent element):

```html
<script
  async
  src="https://YOUR-ATTEST-DOMAIN/widget.js"
  data-product="airline-cab"
  data-layout="wall"
  data-accent="#2563eb"
  data-limit="9"></script>
```

### Attributes

| Attribute | Required | Values | Default | Meaning |
| --- | --- | --- | --- | --- |
| `data-product` | **yes** | slug | — | Which product's wall to load |
| `data-layout` | no | `wall`, `grid`, `carousel`, `marquee`, `badge`, `float` | `wall` | Rendering style |
| `data-theme` | no | `light`, `dark` | `light` | Colour scheme |
| `data-accent` | no | `#rrggbb` | `#2563eb` | Brand colour for avatars/buttons |
| `data-limit` | no | `1`–`50`, or `0` | all | Max cards returned |
| `data-animation` | no | `up`, `fade`, `zoom`, `slide`, `flip`, `none` | `up` | Scroll-in animation preset |
| `data-container` | no | element id | script's parent | Mount target |

Layout behaviour:

- `wall` — masonry columns (1 / 2 / 3 by breakpoint)
- `grid` — even rows, equal-height cards
- `carousel` — horizontally scrollable row (user-driven)
- `marquee` — two auto-scrolling rows of reviews, opposite directions, seamless loop;
  pauses on hover and falls back to a static grid for reduced-motion users
- `badge` — compact "★★★★★ 4.8 (12 reviews)" pill, links to the wall
- `float` — fixed corner bubble that opens a panel (always mounts to `<body>`;
  `data-container` is ignored)

### Custom mount point

```html
<section id="reviews"></section>
<script
  async
  src="https://YOUR-ATTEST-DOMAIN/widget.js"
  data-product="airline-cab"
  data-layout="grid"
  data-container="reviews"></script>
```

The script injects its own scoped CSS (`attest-*` classes) and does not depend on
Tailwind or any framework on the host page.

### Single-page apps

`widget.js` runs once per `<script>` tag. If you inject the tag after a client-side
route change, create a fresh `<script>` element so it executes again:

```js
const script = document.createElement("script");
script.src = "https://YOUR-ATTEST-DOMAIN/widget.js";
script.async = true;
script.dataset.product = "airline-cab";
script.dataset.layout = "grid";
document.getElementById("reviews").appendChild(script);
```

---

## 3. Path B — iframe embed

```html
<iframe
  src="https://YOUR-ATTEST-DOMAIN/wall/airline-cab?embed=1&layout=wall&theme=light&accent=%232563eb&limit=6"
  width="100%"
  height="780"
  style="border:0;border-radius:24px;overflow:hidden"
  loading="lazy"
  title="Airlinecabz testimonials"></iframe>
```

### Query parameters

| Param | Values | Default | Meaning |
| --- | --- | --- | --- |
| `embed` | `1` | — | Enables embed mode (no site chrome, `noindex`) |
| `layout` | `wall`, `grid`, `carousel`, `marquee`, `badge` | `wall` | Rendering style |
| `theme` | `light`, `dark` | `light` | Colour scheme |
| `accent` | `%23rrggbb` (URL-encoded `#rrggbb`) | `#2563eb` | Brand colour |
| `limit` | integer | all | Max cards |
| `cta` | `0` | on | Hides the "collect your own reviews" call to action |
| `animation` | `up`, `fade`, `zoom`, `slide`, `flip`, `none` | `up` | Scroll-in animation preset |

Suggested heights: `wall` 780, `grid` 720, `carousel` 460, `marquee` 560, `badge` 96. All layouts are
responsive; iframes cannot auto-resize, so re-check heights on mobile breakpoints.

---

## 4. Path C — JSON API

### Endpoint

```
GET /api/v1/widget/{slug}
```

- `200` — public product exists
- `404` — unknown slug, or the product is private (`is_public = 0`)
- Headers: `Access-Control-Allow-Origin: *`,
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- `OPTIONS` is supported for preflight

### Response

```json
{
  "product": {
    "name": "Airlinecabz",
    "slug": "airline-cab",
    "description": "Airport taxi and outstation cab service in Bangalore.",
    "websiteUrl": "https://airline-cab.com",
    "logoUrl": null
  },
  "total": 6,
  "testimonials": [
    {
      "id": "0b0d8e5e-2a2f-4f0d-9d55-1a2f7a4c9f11",
      "content": "Very professional and safe. As a solo female traveler ...",
      "rating": 5,
      "author": {
        "name": "Priya Sharma",
        "headline": "Business Analyst",
        "avatarUrl": null,
        "profileUrl": null,
        "identitySource": "demo"
      },
      "sourceType": "customer",
      "submittedAt": "2026-11-18T12:00:00.000Z"
    }
  ]
}
```

Field notes:

- `testimonials` — **approved only**, ordered by `displayOrder` then newest first.
- `author.headline` — may be `null`; render a fallback such as "Verified customer".
- `author.identitySource` — `"linkedin"` when the reviewer signed in with LinkedIn, else `"demo"`.
- `author.avatarUrl` / `profileUrl` — may be `null`; fall back to initials.
- `sourceType` — `"customer"` (collected via the public form) or `"exchange"` (peer review).
- `rating` — integer `1`–`5`.

### Client-side fetch

```js
const res = await fetch("https://YOUR-ATTEST-DOMAIN/api/v1/widget/airline-cab");
if (!res.ok) throw new Error(`Attest: ${res.status}`);
const { testimonials, total } = await res.json();
```

### Server-side fetch (Next.js App Router)

```ts
export const revalidate = 60; // matches the API cache window

export async function getTestimonials(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_ATTEST_BASE_URL}/api/v1/widget/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return { total: 0, testimonials: [] };
  return res.json();
}
```

Do **not** call the API from the browser with an internal database or admin credential —
this endpoint needs no auth, and admin actions live behind server actions, not REST.

---

## 5. Content lifecycle

```
/collect/<slug>  →  pending  →  dashboard/inbox  →  approved  →  wall + API + embed
                                          └──────→  rejected / withdrawn (hidden)
```

- New submissions are **pending** and never public until approved.
- The owner approves/rejects in **Dashboard → Inbox**; ordering is set in **Dashboard → Wall**.
- Customers can withdraw their own review, which removes it from every surface.
- Reviewers earn credits when they submit through the exchange flow (`/product/<slug>`),
  not through the public collect form.

Give customers this link to collect testimonials:

```
https://YOUR-ATTEST-DOMAIN/collect/airline-cab
```

---

## 6. Local verification

```bash
# 1. Start the app
npm run dev

# 2. Check the API contract
curl -s http://localhost:3000/api/v1/widget/airline-cab | head -c 400

# 3. Check the wall page
curl -o /dev/null -w '%{http_code}\n' http://localhost:3000/wall/airline-cab

# 4. Check the health probe
curl -s http://localhost:3000/api/health
```

`/api/health` returns `200` with `{ status: "healthy", database: { status: "connected" } }`,
or `503` when the database probe fails.

Demo fixtures: `scripts/seed-airlinecabz-demo.mjs` creates a product + sample reviews
(needs `DATABASE_URL`; run with `node --env-file=.env.local scripts/seed-airlinecabz-demo.mjs`),
and `public/airlinecabz-demo.html` is a host-page replica that embeds the widget at
`http://localhost:3000/airlinecabz-demo.html`.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Nothing renders | Script tag placed after `</body>`, or the parent element was empty/removed | Put the tag where the wall should appear, or set `data-container` |
| `404` from the API | Wrong slug, product is private, or product has no approved reviews (empty `testimonials`) | Check `/wall/<slug>` opens publicly; approve at least one review |
| Widget shows old reviews | 60s edge cache + `stale-while-revalidate` | Wait ~1 minute or hard-refresh |
| Cards unstyled/overlapping | Host page CSS forcing `figure`/`blockquote` styles | Add a wrapper with `all: initial` or use the iframe embed |
| Badge/floating bubble links nowhere | Image/Link preview blocked | The badge links to `/wall/<slug>`; verify the wall is public |
| `Access to fetch ... blocked by CORS` | API hit from a browser with a custom `Origin` on a private product | Only public products are CORS-enabled |
| Avatars show initials | Reviewer has no LinkedIn photo (`avatarUrl: null`) | Expected; fall back to initials |

---

## 8. Security notes

- The slug is a public identifier — anyone can read a public wall. Never put private
  product data in `name`/`description`.
- There is no write access over the public API. Moderation and product edits happen via
  authenticated server actions.
- Rejected and withdrawn testimonials are filtered server-side; never filter on the client.
- LinkedIn sign-in is optional for reviewers; demo-identity reviews are labelled as such.
