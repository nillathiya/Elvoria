// ============================================================
//  General API rate limiting (spec §21).
//
//  Distinct from the login lockout in rate-limit-service: that one is about
//  guessing a 6-digit PIN and must survive a restart, so it lives on disk.
//  This one is about request volume — cheap abuse and accidental hammering —
//  and is kept in memory on purpose: a file write per request would make the
//  limiter itself the bottleneck it is meant to prevent.
//
//  Consequence worth knowing: the counters are per process and reset on
//  restart. Behind several instances, the effective limit multiplies by the
//  instance count. For a single-server file-based deployment that is exact;
//  scale further and this belongs in a shared store.
// ============================================================

import { RateLimitError } from "../utils/errors.js";

const buckets = new Map();

// Verification is far more expensive than a page read — each call hits a
// blockchain node — so it gets its own, much tighter budget.
const RULES = [
  { test: (p) => p.includes("/verify-tx"), limit: 10, windowMs: 60_000, name: "verify" },
  { test: (p) => p.includes("/login") || p.includes("/register"), limit: 20, windowMs: 60_000, name: "auth" },
  { test: () => true, limit: 120, windowMs: 60_000, name: "api" },
];

function ruleFor(pathname) {
  return RULES.find((r) => r.test(pathname));
}

// Bounded sweep: without it the map grows one entry per client forever, which
// is a slow memory leak on a public endpoint.
function sweep(now) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function assertWithinRateLimit(request, clientIp) {
  const { pathname } = new URL(request.url);
  const rule = ruleFor(pathname);

  const now = Date.now();
  sweep(now);

  const key = `${rule.name}:${clientIp}`;
  const bucket = buckets.get(key);

  // Fixed window: simple and predictable. A burst can straddle a boundary and
  // briefly allow up to 2x the limit, which is an acceptable trade here.
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  bucket.count += 1;

  if (bucket.count > rule.limit) {
    const seconds = Math.ceil((bucket.resetAt - now) / 1000);
    throw new RateLimitError(`Too many requests. Try again in ${seconds}s.`, seconds);
  }
}

// Test seam — the module-level map would otherwise leak between test cases.
export function resetRateLimits() {
  buckets.clear();
}
