import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

/**
 * Prevents Server-Side Request Forgery (SSRF).
 *
 * The roast feature fetches an arbitrary user-supplied URL FROM THE SERVER.
 * Without this check, an attacker could submit URLs pointing at:
 *  - internal services (http://localhost:5432, http://10.0.0.5:6379)
 *  - cloud metadata endpoints (http://169.254.169.254/...)
 *  - other private/reserved ranges
 * and use this server as a proxy to probe or attack internal infrastructure.
 *
 * Strategy: only allow http/https, only allow standard ports, resolve the
 * hostname ourselves, and reject if ANY resolved IP is private/reserved.
 * We re-check the IP (not just the hostname string) because DNS rebinding
 * can return a private IP for an innocuous-looking public hostname.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const ALLOWED_PORTS = new Set(['', '80', '443']);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
]);

function isPrivateOrReservedIp(ip) {
  try {
    const addr = ipaddr.process(ip); // normalizes IPv4-mapped IPv6 etc.
    const range = addr.range(); // 'private' | 'loopback' | 'linkLocal' | 'uniqueLocal' | 'unicast' | etc.

    // ipaddr.js ranges that are NOT safe to fetch:
    const unsafeRanges = new Set([
      'private',        // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      'loopback',        // 127.0.0.0/8, ::1
      'linkLocal',       // 169.254.0.0/16 (includes cloud metadata!), fe80::/10
      'uniqueLocal',     // fc00::/7 (IPv6 private)
      'reserved',
      'unspecified',     // 0.0.0.0
      'broadcast',
      'carrierGradeNat', // 100.64.0.0/10
    ]);

    return unsafeRanges.has(range);
  } catch {
    // If we can't parse it, treat as unsafe.
    return true;
  }
}

export class UrlValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UrlValidationError';
  }
}

/**
 * Validates a user-supplied URL string and returns a safe, parsed URL object.
 * Throws UrlValidationError with a user-friendly message on any failure.
 */
export async function validateAndResolveUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    throw new UrlValidationError('Give me an actual URL.');
  }

  const trimmed = rawUrl.trim();

  if (trimmed.length > 2048) {
    throw new UrlValidationError('That URL is suspiciously long. Try a real one.');
  }

  let parsed;
  try {
    // Default to https:// if no protocol given.
    parsed = new URL(/^[a-zA-Z]+:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new UrlValidationError("That's not a URL, that's just typing.");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new UrlValidationError('Only http and https URLs are allowed.');
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new UrlValidationError('Non-standard ports are not allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new UrlValidationError("Nice try. Can't roast internal infrastructure.");
  }

  // If the hostname is itself a literal IP, validate it directly.
  if (ipaddr.isValid(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new UrlValidationError("Nice try. That's a private address.");
    }
  } else {
    // Resolve DNS ourselves and check every returned address.
    let records;
    try {
      records = await dns.lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new UrlValidationError("Couldn't resolve that domain. Does it even exist?");
    }

    if (records.length === 0) {
      throw new UrlValidationError("That domain doesn't resolve to anything.");
    }

    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new UrlValidationError("That domain resolves to a private address. Nope.");
      }
    }
  }

  return parsed;
}
