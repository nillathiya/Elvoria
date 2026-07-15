// ============================================================
//  Cross-process advisory file locks.
//
//  Built on O_EXCL create ("wx"), which is atomic: exactly one caller can
//  create a given lock file, so exactly one caller holds the lock. This is
//  what stops two simultaneous requests from both claiming the same TX hash.
// ============================================================

import { promises as fs } from "fs";
import path from "path";
import { randomBytes, createHash } from "crypto";
import { DIRS } from "../config/storage-config.js";
import { LockTimeoutError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_STALE_MS = 30_000;
const RETRY_BASE_MS = 25;
const RETRY_MAX_MS = 250;

// Lock names come from user input (TX hashes), so hash them rather than
// trusting them as filenames — a name like "../../admin" must not escape.
function lockPathFor(name) {
  const safe = createHash("sha256").update(String(name)).digest("hex");
  return path.join(DIRS.locks, `${safe}.lock`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readLockToken(lockPath) {
  try {
    return JSON.parse(await fs.readFile(lockPath, "utf8"));
  } catch {
    return null;
  }
}

// A holder that crashed leaves its lock file behind forever. Break a lock only
// when it is both past the stale deadline AND still carries the same token we
// saw when we judged it stale — otherwise we could delete a fresh lock that a
// new holder acquired in the meantime.
async function breakIfStale(lockPath, staleMs) {
  const before = await readLockToken(lockPath);
  if (!before) return;
  if (Date.now() - before.acquiredAt < staleMs) return;

  await sleep(RETRY_BASE_MS);
  const after = await readLockToken(lockPath);
  if (!after || after.token !== before.token) return;

  await fs.rm(lockPath, { force: true }).catch(() => {});
}

export async function acquireLock(name, { timeoutMs = DEFAULT_TIMEOUT_MS, staleMs = DEFAULT_STALE_MS } = {}) {
  await fs.mkdir(DIRS.locks, { recursive: true });

  const lockPath = lockPathFor(name);
  const token = randomBytes(16).toString("hex");
  const deadline = Date.now() + timeoutMs;
  let delay = RETRY_BASE_MS;

  for (;;) {
    let handle;
    try {
      handle = await fs.open(lockPath, "wx");
      await handle.writeFile(
        JSON.stringify({ name: String(name), token, pid: process.pid, acquiredAt: Date.now() }),
        "utf8"
      );
      await handle.close();
      return { lockPath, token };
    } catch (err) {
      if (handle) await handle.close().catch(() => {});
      if (err.code !== "EEXIST") throw err;

      if (Date.now() >= deadline) {
        throw new LockTimeoutError(`Timed out acquiring lock after ${timeoutMs}ms`);
      }
      await breakIfStale(lockPath, staleMs);
      await sleep(delay);
      delay = Math.min(delay * 2, RETRY_MAX_MS);
    }
  }
}

export async function releaseLock(lock) {
  if (!lock) return;
  // Only remove the lock if we still own it — if ours was broken as stale and
  // someone else re-acquired, deleting it would release *their* lock.
  const current = await readLockToken(lock.lockPath);
  if (current && current.token !== lock.token) return;
  await fs.rm(lock.lockPath, { force: true }).catch(() => {});
}

export async function withLock(name, fn, opts) {
  const lock = await acquireLock(name, opts);
  try {
    return await fn();
  } finally {
    await releaseLock(lock);
  }
}
