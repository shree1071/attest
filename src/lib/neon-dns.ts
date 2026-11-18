import dns from "node:dns";
import { Resolver } from "node:dns/promises";

/**
 * Some local networks run a DNS filter that refuses `*.neon.tech` lookups.
 * Neon's public endpoints resolve normally through public resolvers, so fall
 * back to those only when the OS resolver returns ENOTFOUND for a Neon host.
 * Every other hostname keeps the platform resolver untouched.
 */
let installed = false;

export function installNeonDnsFallback(): void {
  if (installed) return;
  installed = true;

  const originalLookup = dns.lookup.bind(dns) as (
    hostname: string,
    options: dns.LookupOptions,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
  ) => void;

  const resolver = new Resolver();
  const servers = (process.env.NEON_DNS_SERVERS ?? "1.1.1.1,8.8.8.8")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (servers.length > 0) resolver.setServers(servers);

  const lookup = (
    hostname: string,
    options: dns.LookupOptions | ((...args: unknown[]) => void),
    callback?: (...args: unknown[]) => void,
  ) => {
    let opts: dns.LookupOptions = {};
    let done = callback;
    if (typeof options === "function") {
      done = options as (...args: unknown[]) => void;
    } else {
      opts = options;
    }
    if (!done) throw new TypeError("A callback is required");

    originalLookup(hostname, opts, (err, address, family) => {
      if (!err) {
        done!(null, address, family);
        return;
      }
      if (!hostname.endsWith(".neon.tech")) {
        done!(err, address, family);
        return;
      }

      resolver
        .resolve4(hostname)
        .then((addresses) => {
          if (addresses.length === 0) {
            done!(err, address, family);
            return;
          }
          if (opts.all) {
            done!(
              null,
              addresses.map((value) => ({ address: value, family: 4 })),
              4,
            );
          } else {
            done!(null, addresses[0], 4);
          }
        })
        .catch(() => done!(err, address, family));
    });
  };

  (dns as unknown as { lookup: unknown }).lookup = lookup;
}
