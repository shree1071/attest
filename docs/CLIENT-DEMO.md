# Client demo script — Attest

Two versions:

- **Slow version (15 min)** — first time showing this client, or a non-technical audience.
  Start here and read it line by line; it includes pauses, clicks, and what to point at.
- **Fast version (7 min)** — repeat demos, or a technical buyer. Skip to
  [Fast demo flow](#fast-demo-flow-7-min).

Every URL works on the local dev server.

---

## Before the call (5 minutes)

```bash
npm run dev
node --env-file=.env.local scripts/seed-airlinecabz-demo.mjs   # demo product + 6 approved reviews
```

Open these tabs in order, and keep the last one in front:

1. `http://localhost:3000/airlinecabz-demo.html` — Airlinecabz page with the wall embedded
2. `http://localhost:3000/dashboard` — your dashboard
3. `http://localhost:3000/collect/airline-cab` — what a customer sees
4. `http://localhost:3000/dashboard/inbox` — moderation queue
5. `http://localhost:3000/dashboard/wall` — layout/theme controls + embed snippet
6. `http://localhost:3000/wall/airline-cab` — the hosted public wall

Close Slack/email. Use a normal browser window (not incognito) so your session is ready.

Also rehearse once out loud. The demo lands far better the second time you say the words.

---

## Slow demo (15 min)

Rules for the whole call:

- **One idea per screen.** Don't switch tabs while they're still reading.
- **Say the benefit, then the click.** Never click silently.
- **Pause after each section** and ask: "Does that match how you collect reviews today?"
- **Do the work in front of them.** Real submission, real approval. Slides feel fake.

### 0:00 — Frame it (60s, no clicking)

Share the window; stay on tab 1 but don't scroll yet.

> "Before I show you anything — the problem I'm solving is not 'reviews'. You probably have
> happy customers. The problem is that asking them is manual, and a brand-new product has
> nobody to ask yet. So the wall stays empty exactly when you need it most."

> "Attest does three things: it gives you a link to collect reviews, an inbox to approve them,
> and a wall you paste onto your own site in one line. And to solve the empty-wall problem,
> businesses can review each other in exchange for credits."

**Pause.** "Does that sound like a real problem for you, or have you already solved it?"
Let them answer. Their answer decides whether you emphasise collection or the exchange.

### 1:00 — Show the finished result first (2 min, tab 1)

Scroll slowly down the Airlinecabz page. Stop at the review section.

> "This is a customer site — not our app. These reviews are live from Attest: stars, name,
> job title, three-column layout, brand blue. They pasted one script tag."

Point at the rating pill next to the CTA:

> "Same data, different layout — that's one attribute in the tag, not a second integration."

Scroll up again and point at the logo, nav, hero:

> "Nothing else on their site changed. No rebuild, no developer time."

**Pause.** "This is what your customers would see."

### 3:00 — Show where reviews come from (3 min, tab 3)

Switch to `/collect/airline-cab`.

> "This is the link you send. WhatsApp, email signature, after a booking — wherever you talk
> to customers. They don't create an account, they don't install anything."

Fill the form **live**, narrating while typing:

- Name: your own name or theirs
- Email: any address
- Stars: 5
- Review (100+ characters required):

> "Booked an airport pickup at short notice and the driver was already waiting when I landed.
> Transparent fare, no surprises. Would book again for my next trip."

Submit, then stop on the confirmation screen.

> "Notice what did **not** happen: it isn't public yet. Every review waits for your approval."

### 6:00 — The approval inbox (2.5 min, tab 4)

Switch to `/dashboard/inbox`. The review just submitted is at the top.

> "This is the owner's morning routine. Everything queued in one place, with the reviewer's
> identity attached — not an anonymous comment box."

Click **Approve**. Then switch to tab 6 (`/wall/airline-cab`) and refresh.

> "Approved, and now it's live on the wall."

Then switch to tab 1 and refresh.

> "…and on the client's own site. Same record, three surfaces — with about a minute of cache
> in the embed, which is why I refreshed."

Optional if they look engaged: reject one review on screen and show it disappear from the
wall, to prove the control is real.

### 8:30 — The part they'll actually own (2 min, tab 5)

Switch to `/dashboard/wall`.

> "This is the only screen you touch after setup. Layout, light or dark, your brand colour,
> how many cards, and a live preview."

Click **Grid**, pick their brand colour, then point at the snippet box:

> "You copy this and paste it once. That's the whole install."

Mention the alternative only if someone is technical:

> "If your site blocks third-party scripts, there's an iframe version with the same options."

### 10:30 — The differentiator: the exchange (2.5 min, tab 2)

Switch to `/dashboard` → **Credits** tab.

> "Now the uncomfortable case: what if you have no customers yet? You can't ask nobody."

> "So Attest lets businesses review each other. You review someone, you earn 5 credits.
> You spend 1 to request a review of your own product. Everyone gets proof instead of a
> blank wall on day one."

Point at the balance in the header and the ledger rows.

> "Every credit movement is recorded — earned, spent, and the balance after. It's an
> auditable ledger, not a number we hope is right."

### 13:00 — Trust close (1.5 min)

Open any card showing **Signed in with LinkedIn** (or explain it if the wall is demo-only).

> "Reviews can carry a verified LinkedIn identity, and the reviewer can withdraw at any
> time. That's the difference between a testimonial platform and a comment widget."

Then land the close:

> "The whole loop is: send the link, approve in the inbox, it appears on your site. The only
> setup is one script tag. What would stop you from running this on one product next week?"

**Stop talking.** Let them answer. Book the follow-up from their answer, not from your script.

---

## Fast demo flow (7 min)

### 1. Start with the result, not the tool (60s)

**Show:** tab 1, `airlinecabz-demo.html` — scroll slowly through the cards.

**Say:**
> "This is Airlinecabz's site. These reviews are live from Attest — stars, name, role,
> and the layout matches their brand. They pasted one script tag. Nothing else changed
> on their site."

**Point out:** the rating pill next to the CTA ("★★★★★ 4.8 · 6 reviews") — same data,
different layout, one attribute.

### 2. Show where reviews come from (90s)

**Show:** tab 3, `/collect/airline-cab`.

**Say:**
> "They share this link — WhatsApp, email signature, post-purchase message. The customer
> writes their review, picks a rating, and consents to publication. No account needed."

**Do:** submit a short review live (100+ characters), e.g.

> "Booked an airport pickup at short notice and the driver was already waiting when I
> landed. Transparent fare, no surprises. Would book again for my next trip."

**Say:** "It's pending, not public. That's deliberate."

### 3. Show the approval inbox (90s)

**Show:** tab 4, `/dashboard/inbox` → the new review at the top.

**Say:**
> "Nothing goes live without the owner's approval. This is the difference between a
> testimonial platform and a comment box."

**Do:** click **Approve**, then jump to tab 6 `/wall/airline-cab` and refresh.

**Say:** "Approved reviews appear on the wall, in the API, and in every embed — the customer
site picks it up automatically (within about a minute of cache)."

Optional: approve a second one and show **Dashboard → Wall** reordering.

### 4. Show the embed (60s)

**Show:** tab 5, `/dashboard/wall`.

**Say:**
> "This is the control panel the client actually touches — layout, light/dark, brand colour,
> card count, with a live preview."

**Do:** switch to `Grid`, pick their brand blue, then read the copy-paste snippet:

```html
<script async src="https://your-domain/widget.js"
  data-product="airline-cab" data-layout="grid" data-accent="#2563eb"></script>
```

**Say:** "If they can't add scripts, there's an iframe version with the same options."

### 5. Show the exchange model — the differentiator (90s)

**Show:** tab 2, `/dashboard` → **Credits** tab.

**Say:**
> "New products have no customers to ask. So Attest lets businesses review each other.
> You review a product, you earn a credit. You spend a credit to open a request, and
> another business reviews you. Everyone starts with proof instead of a blank wall."

**Point out:** the `Review others, earn credits` button and the credit balance in the header.

### 6. Close on trust (30s)

**Show:** any card with "Signed in with LinkedIn".

**Say:**
> "Reviews can carry a LinkedIn-verified identity, so the wall isn't anonymous text.
> And customers can withdraw their review at any time."

---

## If they ask…

| Question | Answer |
| --- | --- |
| "Can we moderate everything?" | Yes — every submission is pending until the owner approves it. |
| "What stops fake reviews?" | Owner approval, one review per reviewer per product, optional LinkedIn identity, and withdrawal rights. |
| "Will it match our site?" | Light/dark, brand hex, five layouts, wall/grid/carousel/badge/floating bubble. |
| "How long to install?" | One script tag, or one iframe. No build step on their side. |
| "Does it slow our site?" | The script is a single small file and loads the wall asynchronously after the page. |
| "Where is data stored?" | Self-hosted database behind the Attest app; the public API exposes only approved reviews. |
| "Can we export?" | The JSON API at `/api/v1/widget/<slug>` returns the full approved set. |
| "Price?" | Leave to your own pricing sheet — don't improvise numbers in the demo. |

---

## Failure fallbacks

| If this breaks | Do this instead |
| --- | --- |
| LinkedIn sign-in fails mid-demo | Skip it; use the "Local testing" name/email form and say identity is optional |
| A submitted review doesn't appear | It's pending by design — go straight to the inbox and approve it on screen |
| Approved review not in the embed yet | Explain the ~60s cache; show the wall page directly, then the embed |
| Demo page looks unstyled | Confirm `npm run dev` is running and the tab was loaded after it started |

---

## Reset after the demo

```bash
# re-adds any reviews you deleted (needs DATABASE_URL in the environment)
node --env-file=.env.local scripts/seed-airlinecabz-demo.mjs
```

New fake submissions from the demo stay in the inbox — reject them so the next demo starts
clean, or reset the database and re-seed.
