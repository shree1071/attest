// Seeds dummy approved reviews onto the demo product so the dashboard wall and
// the Airlinecabz demo embed have something to show.
//
//   node --env-file=.env.local scripts/seed-airlinecabz-demo.mjs
//
// Targets an existing product by slug (default: airline-cab). If it does not
// exist, an owner and product are created. Safe to re-run: existing reviews are
// left untouched.
import { randomUUID } from "node:crypto";
import dns from "node:dns";
import { Resolver } from "node:dns/promises";
import { Pool } from "pg";

const servers = (process.env.DNS_SERVERS ?? "1.1.1.1,8.8.8.8")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);
if (servers.length > 0) {
  // Some local networks refuse *.neon.tech from the OS resolver. Fall back to a
  // public resolver only for Neon hosts; every other host keeps OS DNS.
  const resolver = new Resolver();
  resolver.setServers(servers);
  const originalLookup = dns.lookup.bind(dns);
  dns.lookup = function lookup(hostname, options, callback) {
    const opts = typeof options === "function" ? {} : { ...(options || {}) };
    const cb = typeof options === "function" ? options : callback;
    originalLookup(hostname, opts, (error, address, family) => {
      if (!error || !hostname.endsWith(".neon.tech")) return cb(error, address, family);
      resolver
        .resolve4(hostname)
        .then((addresses) => {
          if (opts.all) return cb(null, addresses.map((value) => ({ address: value, family: 4 })), 4);
          return cb(null, addresses[0], 4);
        })
        .catch(() => cb(error, address, family));
    });
  };
}

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Run `neon env pull` (or `neon deploy`) first, then:\n" +
      "  node --env-file=.env.local scripts/seed-airlinecabz-demo.mjs",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 10_000 });
const slug = process.env.DEMO_PRODUCT_SLUG ?? "airline-cab";
const now = Date.now();

// [name, headline, rating, body, status]
// Approved reviews appear on the public wall and embed; pending and rejected
// reviews populate the dashboard Inbox tabs for demos.
const reviews = [
  ["Priya Sharma", "Business Analyst", 5, "Very professional and safe. As a solo female traveler taking a late-night cab from the airport, I felt completely secure. Highly recommended.", "approved"],
  ["Amit Patel", "Family Vacation", 5, "Booked an outstation trip to Coorg. The pricing was completely transparent with no hidden charges, and the driver knew all the good restaurants on the way.", "approved"],
  ["Rahul Verma", "Frequent Flyer", 5, "Best airport taxi service in Bangalore. I used to rely on ride-hailing apps but their cancellations were a nightmare. Airlinecabz is 100% reliable.", "approved"],
  ["Sneha Iyer", "Tech Professional", 5, "The booking process is so seamless! Got instant confirmation and the WhatsApp updates are very helpful. Will use Airlinecabz again.", "approved"],
  ["Karthik Rao", "Business Traveler", 4, "Clean Innova Crysta, the driver arrived 15 minutes early, and the fare was exactly what was quoted. Perfect for early morning flights.", "approved"],
  ["Ananya Nair", "Solo Traveler", 5, "Prompt pickup at 4 AM, spotless car and a courteous driver. This is now my default airport transfer in Bengaluru.", "approved"],
  ["Meera Krishnan", "Product Manager", 5, "Booked a pickup for my parents arriving on a late flight. The driver was waiting at the gate with a name board and kept me updated on WhatsApp the whole way home.", "pending"],
  ["Vikram Shetty", "Startup Founder", 4, "Used the outstation service for a client visit to Mysore. Car was clean and the driver was punctual, though traffic made us 20 minutes late. Would book again.", "pending"],
  ["Divya Menon", "Marketing Lead", 5, "Flight landed two hours early and the team still had a cab ready in fifteen minutes. That kind of flexibility is why I keep coming back.", "pending"],
  ["Arjun Das", "Weekend Traveler", 3, "The ride itself was comfortable, but the driver took a longer route than expected. Support resolved the fare query quickly, so I am giving them another try.", "rejected"],
];

const client = await pool.connect();
let added = 0;

try {
  await client.query("BEGIN");

  let product = (
    await client.query("SELECT id, owner_id FROM products WHERE slug = $1", [slug])
  ).rows[0];

  if (!product) {
    const ownerEmail = "owner@airlinecabz.example";
    let ownerId = (
      await client.query("SELECT id FROM users WHERE email = $1", [ownerEmail])
    ).rows[0]?.id;
    if (!ownerId) {
      ownerId = randomUUID();
      await client.query(
        `INSERT INTO users (id, email, name, identity_source, created_at)
         VALUES ($1, $2, $3, 'demo', $4)`,
        [ownerId, ownerEmail, "Airlinecabz", new Date(now)],
      );
    }
    const productId = randomUUID();
    await client.query(
      `INSERT INTO products
         (id, owner_id, name, description, website_url, category, slug,
          is_public, accepting_testimonials, created_at)
       VALUES ($1, $2, $3, $4, $5, 'Travel', $6, true, true, $7)`,
      [
        productId,
        ownerId,
        "Airlinecabz",
        "Airport taxi and outstation cab service in Bangalore with transparent pricing and on-time pickups.",
        "https://airlinecabz.com",
        slug,
        new Date(now),
      ],
    );
    product = { id: productId, owner_id: ownerId };
  }

  let approvedPosition = 0;
  for (let index = 0; index < reviews.length; index += 1) {
    const [name, headline, rating, body, status] = reviews[index];
    const email = `reviewer-${index + 1}@airlinecabz.example`;
    const submittedAt = new Date(now - (reviews.length - index) * 86_400_000);

    let authorId = (
      await client.query("SELECT id FROM users WHERE email = $1", [email])
    ).rows[0]?.id;
    if (!authorId) {
      authorId = randomUUID();
      await client.query(
        `INSERT INTO users
           (id, email, name, headline, headline_source, identity_source, created_at)
         VALUES ($1, $2, $3, $4, 'self_reported', 'demo', $5)`,
        [authorId, email, name, headline, submittedAt],
      );
    }

    const existing = await client.query(
      "SELECT id FROM testimonials WHERE product_id = $1 AND author_id = $2",
      [product.id, authorId],
    );
    if (existing.rowCount > 0) continue;

    const snapshot = {
      schema_version: 1,
      identity_source: "demo",
      provider: null,
      provider_subject: null,
      display_name: name,
      headline,
      headline_source: "self_reported",
      profile_url: null,
      avatar_url: null,
      observed_at: null,
      submitted_at: submittedAt.toISOString(),
    };

    await client.query(
      `INSERT INTO testimonials
         (id, product_id, author_id, content, rating, source_type, status, identity_snapshot,
          consent_at, submitted_at, approved_at, rejected_at, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, 'customer', $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        randomUUID(),
        product.id,
        authorId,
        body,
        rating,
        status,
        JSON.stringify(snapshot),
        submittedAt,
        submittedAt,
        status === "approved" ? submittedAt : null,
        status === "rejected" ? submittedAt : null,
        status === "approved" ? approvedPosition : 0,
        submittedAt,
      ],
    );
    if (status === "approved") approvedPosition += 1;
    added += 1;
  }

  await client.query("COMMIT");
  console.log(`Airlinecabz demo ready: +${added} reviews on ${slug} (approved wall: /wall/${slug})`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
