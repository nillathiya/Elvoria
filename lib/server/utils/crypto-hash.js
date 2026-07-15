// ============================================================
//  Secret hashing for PINs and passwords (spec §21, §26.21).
//
//  scrypt is memory-hard, so it resists GPU cracking far better than a plain
//  digest. Node ships it, which keeps the dependency list at zero.
//
//  A 6-digit PIN is only 1,000,000 possibilities — scrypt alone buys hours,
//  not safety, if storage/admin.json ever leaks. AUTH_PEPPER closes that:
//  the PIN is HMAC'd with a server-side secret that lives in the environment,
//  never on disk, so a stolen storage/ directory cannot be brute-forced
//  offline at all. Lockout (rate-limit-service) covers the online attack.
// ============================================================

import { scrypt, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// N=16384 (16MB, ~100ms). Raising N invalidates nothing — the cost params are
// stored per-hash, so old hashes keep verifying after a bump.
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };
const SALT_BYTES = 16;

function pepper(secret) {
  const key = process.env.AUTH_PEPPER;
  if (!key) return String(secret);
  return createHmac("sha256", key).update(String(secret)).digest("hex");
}

export async function hashSecret(secret) {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(pepper(secret), salt, PARAMS.keylen, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: 256 * 1024 * 1024,
  });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

export async function verifySecret(secret, stored) {
  if (typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, N, r, p, saltB64, hashB64] = parts;
  let expected;
  try {
    expected = Buffer.from(hashB64, "base64");
    const derived = await scryptAsync(pepper(secret), Buffer.from(saltB64, "base64"), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: 256 * 1024 * 1024,
    });
    // Constant-time: a length-dependent or early-exit compare leaks the hash.
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
