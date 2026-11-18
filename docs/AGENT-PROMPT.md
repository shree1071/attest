# Agent prompt — connect Attest reviews to a site

Copy the block below into your coding agent. Replace the three `<>` placeholders.
It is written to be executed without further questions.

---

```text
Task: add the Attest testimonial wall to this website.

INPUTS
- Attest base URL: <https://your-attest-domain or http://localhost:3000>
- Product slug: <slug, e.g. airline-cab>
- Target page/section: <e.g. the existing "What our customers say" section on the landing page>

READ FIRST
1. docs/INTEGRATION.md in this repo — authoritative contract for the script embed,
   iframe embed, and the JSON API. Do not invent attributes or endpoints.
2. The page/edit target, so the embed matches the existing markup and CSS conventions.

DECIDE
Pick exactly one integration path and state why in one sentence:
- `<script src="<base>/widget.js" data-product="<slug>" ...>` — default choice.
- `<iframe src="<base>/wall/<slug>?embed=1&...">` — only if the host page has a strict CSP
  that blocks third-party scripts, or the page builder forbids custom scripts.
- `GET <base>/api/v1/widget/<slug>` fetch — only if the site needs bespoke card markup or
  server-side rendering.

IMPLEMENT
- Insert the embed where the reviews should appear; do not restyle the page's other sections.
- Map the site's brand colour to `data-accent` (or `accent` query param) as `#rrggbb`.
- Choose `data-layout` from: wall (masonry, default), grid, carousel, badge, float.
- Choose `data-animation` from: up (default), fade, zoom, slide, flip, none.
- Default to `data-theme="light"` unless the section is dark.
- Set `data-limit` only if the section must cap card count; omit it to show all.
- If using the API path: treat `author.headline`, `avatarUrl`, `profileUrl` as nullable,
  fall back to "Verified customer" and initials, and render 1–5 stars from `rating`.
- Keep the change minimal: one component/section plus, if needed, one env var.
  Do NOT add new dependencies and do NOT modify Attest backend code.

VERIFY (all must pass, paste output)
1. `curl -s <base>/api/v1/widget/<slug> | head -c 300` returns `"product"` and `"testimonials"`.
2. `curl -o /dev/null -w '%{http_code}\n' <base>/wall/<slug>` returns 200.
3. Load the edited page and confirm in the browser that the cards render with stars,
   reviewer name, and headline/role — and that the page has no console errors.
4. If the repo has a build step, run it (e.g. `npm run build`) and report success.

REPORT
- Path chosen and one-line reason.
- Files changed (path + what was added).
- Verification output from steps 1–4.
- Anything still blocked (e.g. the base URL is not publicly reachable, so the embed cannot
  be tested from the client's browser yet).

CONSTRAINTS
- Only approved testimonials are public; never filter statuses client-side.
- The public API is read-only and unauthenticated; never add admin actions to the client.
- The API is cached ~60 seconds at the edge; if cards look stale, wait before debugging.
- If the product has zero approved reviews, say so instead of "fixing" the embed.
```

---

## Variant prompts

**Minimal — "just embed it"**

```text
Read docs/INTEGRATION.md, then add the script embed for product "<slug>" from
<base URL> to <page/section>, using the site's brand colour as data-accent.
Verify with curl + a browser check, and report the diff.
```

**Bespoke UI — "our own cards"**

```text
Read docs/INTEGRATION.md (Path C). Fetch <base>/api/v1/widget/<slug> and render the
testimonials as <describe cards: e.g. masonry cards with stars, name, role>. Handle
null headline/avatar, show a 5-star average in the section header, and keep the fetch
server-side with 60s revalidation. Do not add dependencies.
```

**Troubleshooting existing embed**

```text
The Attest embed on <page> shows nothing. Read docs/INTEGRATION.md section 7, then check
in this order: the script tag's data-product slug, whether the product has approved
reviews (`curl <base>/api/v1/widget/<slug>`), the public status of /wall/<slug>, and
whether host-page CSS is overriding `figure`/`blockquote`. Report the failing layer,
fix only that, and re-verify in the browser.
```

---

## Acceptance checklist for reviewers

- [ ] Embed renders cards with stars, reviewer name, and role/headline
- [ ] Uses an approved colour, a layout appropriate to the section, and an animation preset
- [ ] No new dependencies, no backend edits
- [ ] `curl` on the widget API returns data; `/wall/<slug>` returns 200
- [ ] No console errors on the host page
- [ ] Staleness after approval is explained by the 60s cache, not treated as a bug
