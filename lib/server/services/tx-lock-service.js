// ============================================================
//  Per-TX-hash locking (spec §12, §26.24).
//
//  Scoped to the hash, not to a file: two peers submitting DIFFERENT hashes
//  must verify concurrently (blockchain calls are slow), while two peers
//  submitting the SAME hash must be serialized so only one can claim it.
// ============================================================

import { withLock } from "../utils/file-lock.js";

// Long enough to cover a slow chain call plus the write that follows, so a
// verification in progress is never mistaken for a crashed holder.
const TX_LOCK_TIMEOUT_MS = 30_000;
const TX_LOCK_STALE_MS = 90_000;

export function withTxHashLock(registryKey, fn) {
  return withLock(`txhash:${registryKey}`, fn, {
    timeoutMs: TX_LOCK_TIMEOUT_MS,
    staleMs: TX_LOCK_STALE_MS,
  });
}
