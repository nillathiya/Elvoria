// ============================================================
//  Login throttling + temporary lockout (spec §3.1, §21).
//
//  A 6-digit PIN has only 1,000,000 combinations. Unthrottled, that is a few
//  hours of scripted guessing — so lockout is not a nicety here, it is the
//  primary defence for admin and peer login.
// ============================================================

import { mutateCollection, readCollection, nowIso } from "./file-storage-service.js";
import { RateLimitError } from "../utils/errors.js";

// Escalating: brief pauses absorb fat-fingering, sustained guessing hits walls
// that make exhausting the PIN space take years rather than hours.
const TIERS = [
  { failures: 5, lockMs: 60 * 1000 },
  { failures: 8, lockMs: 15 * 60 * 1000 },
  { failures: 12, lockMs: 60 * 60 * 1000 },
  { failures: 20, lockMs: 24 * 60 * 60 * 1000 },
];

const RESET_AFTER_MS = 24 * 60 * 60 * 1000;

function lockMsFor(failures) {
  let ms = 0;
  for (const tier of TIERS) if (failures >= tier.failures) ms = tier.lockMs;
  return ms;
}

// Scoped per identity AND per client, so one attacker cannot lock a real admin
// out by spamming wrong PINs, and one client cannot dodge the lock by rotating
// the identifier it guesses against.
export function attemptKey(role, identifier, clientIp) {
  return `${role}:${String(identifier || "-").toLowerCase()}:${clientIp || "-"}`;
}

export async function assertNotLocked(key) {
  const rows = await readCollection("loginAttempts");
  const row = rows.find((r) => r.key === key);
  if (!row?.lockedUntil) return;

  const remainingMs = Date.parse(row.lockedUntil) - Date.now();
  if (remainingMs > 0) {
    const seconds = Math.ceil(remainingMs / 1000);
    throw new RateLimitError(`Too many failed attempts. Try again in ${seconds}s.`, seconds);
  }
}

export async function recordFailure(key) {
  return mutateCollection("loginAttempts", (rows) => {
    const now = Date.now();

    // Drop entries that have gone quiet so this file cannot grow forever.
    const kept = rows.filter(
      (r) => now - Date.parse(r.lastFailureAt || 0) < RESET_AFTER_MS || r.key === key
    );

    const i = kept.findIndex((r) => r.key === key);
    const existing = i === -1 ? null : kept[i];

    // A long-quiet identity starts fresh rather than inheriting old failures.
    const stale = existing && now - Date.parse(existing.lastFailureAt) > RESET_AFTER_MS;
    const failures = stale ? 1 : (existing?.failures || 0) + 1;

    const lockMs = lockMsFor(failures);
    const row = {
      key,
      failures,
      lastFailureAt: nowIso(),
      lockedUntil: lockMs ? new Date(now + lockMs).toISOString() : null,
    };

    const next = kept.slice();
    if (i === -1) next.push(row);
    else next[i] = row;

    return { rows: next, value: row };
  });
}

export async function clearFailures(key) {
  await mutateCollection("loginAttempts", (rows) => ({
    rows: rows.filter((r) => r.key !== key),
  }));
}
