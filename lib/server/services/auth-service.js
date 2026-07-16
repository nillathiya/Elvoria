// ============================================================
//  Auth service — admin PIN, peer PIN, normal user password.
//  Controllers call this; it owns hashing, lockout and session creation.
// ============================================================

import { adminRepository } from "../repositories/admin-repository.js";
import { peerRepository } from "../repositories/peer-repository.js";
import { userRepository } from "../repositories/user-repository.js";
import { hashSecret, verifySecret } from "../utils/crypto-hash.js";
import { assertPin, assertPeerCode, assertEmail, assertUsername, assertPassword } from "../utils/validation.js";
import { AuthError, ConflictError, AppError } from "../utils/errors.js";
import { createSession, ROLES } from "./session-service.js";
import { nowIso } from "./file-storage-service.js";
import { attemptKey, assertNotLocked, recordFailure, clearFailures } from "./rate-limit-service.js";

// Verifying against a real-looking hash when the account does not exist keeps
// the failure path the same cost as a wrong-secret path. Without this, a fast
// "no such peer" reply tells an attacker which peer codes are real.
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

async function burnTiming(secret) {
  await verifySecret(secret, DUMMY_HASH);
}

// ---- admin -------------------------------------------------

export async function isAdminProvisioned() {
  return adminRepository.isProvisioned();
}

export async function setAdminPin(pin) {
  assertPin(pin, "Admin PIN");
  const pinHash = await hashSecret(pin);
  await adminRepository.setPinHash(pinHash);
  return { ok: true };
}

// Requires the current PIN even though the caller already holds an admin
// session: it stops someone on an unlocked machine from silently locking the
// real admin out of their own panel.
export async function changeAdminPin({ currentPin, newPin, clientIp }) {
  const key = attemptKey(ROLES.ADMIN, "admin:change-pin", clientIp);
  await assertNotLocked(key);

  assertPin(newPin, "New PIN");

  const admin = await adminRepository.get();
  if (!admin?.pinHash) {
    throw new AppError("Admin PIN is not set up yet", { status: 503, code: "ADMIN_NOT_PROVISIONED" });
  }

  if (!(await verifySecret(String(currentPin ?? ""), admin.pinHash))) {
    await recordFailure(key);
    throw new AuthError("Current PIN is incorrect");
  }

  await clearFailures(key);
  await adminRepository.setPinHash(await hashSecret(newPin));
  return { ok: true };
}

export async function adminLogin({ pin, clientIp }) {
  const key = attemptKey(ROLES.ADMIN, "admin", clientIp);
  await assertNotLocked(key);

  // Format failures are still recorded — otherwise an attacker gets unlimited
  // free probes just by sending malformed input.
  let candidate;
  try {
    candidate = assertPin(pin, "Admin PIN");
  } catch (err) {
    await recordFailure(key);
    throw err;
  }

  const admin = await adminRepository.get();
  if (!admin?.pinHash) {
    await burnTiming(candidate);
    throw new AppError("Admin PIN is not set up yet. Run: npm run set-admin-pin", {
      status: 503,
      code: "ADMIN_NOT_PROVISIONED",
    });
  }

  if (!(await verifySecret(candidate, admin.pinHash))) {
    const row = await recordFailure(key);
    throw new AuthError(
      row.lockedUntil ? "Invalid PIN. Account temporarily locked." : "Invalid PIN"
    );
  }

  await clearFailures(key);
  const session = await createSession({ role: ROLES.ADMIN, subjectId: "admin" });
  return { session };
}

// ---- peer --------------------------------------------------

export async function peerLogin({ peerCode, pin, clientIp }) {
  const key = attemptKey(ROLES.PEER, peerCode, clientIp);
  await assertNotLocked(key);

  let code;
  let candidate;
  try {
    code = assertPeerCode(peerCode);
    candidate = assertPin(pin, "PIN");
  } catch (err) {
    await recordFailure(key);
    throw err;
  }

  const peer = await peerRepository.findByCode(code);
  if (!peer) {
    await burnTiming(candidate);
    await recordFailure(key);
    throw new AuthError("Invalid Peer ID or PIN");
  }

  const ok = await verifySecret(candidate, peer.pinHash);

  // Check the PIN before the status check, then report both the same way: if a
  // disabled peer returned a distinct error, a wrong PIN and a real-but-off
  // account would be distinguishable, confirming which peer codes exist.
  if (!ok || peer.status !== "active") {
    await recordFailure(key);
    throw new AuthError("Invalid Peer ID or PIN");
  }

  await clearFailures(key);

  // Spec §2.1: the admin can "view peer activity". Recorded only on success —
  // a failed attempt is the rate limiter's business, not an activity log.
  // Never allowed to fail the login: not being able to timestamp a sign-in is
  // no reason to refuse a peer who just proved their PIN.
  const lastLoginAt = nowIso();
  await peerRepository.update(peer.id, { lastLoginAt }).catch(() => {});

  const session = await createSession({
    role: ROLES.PEER,
    subjectId: peer.id,
    meta: { peerCode: peer.peerCode, name: peer.name },
  });
  return { session, peer: toPublicPeer({ ...peer, lastLoginAt }) };
}

// ---- normal user -------------------------------------------

export async function userRegister({ email, username, password }) {
  const cleanEmail = assertEmail(email);
  const cleanUsername = assertUsername(username);
  assertPassword(password);

  const passwordHash = await hashSecret(password);

  try {
    // Uniqueness is enforced inside the repository's lock, not by a check here
    // — two simultaneous registrations of the same email must not both pass.
    const user = await userRepository.create({
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      status: "active",
    });
    return toPublicUser(user);
  } catch (err) {
    if (err.code === "DUPLICATE") {
      throw new ConflictError(`That ${err.field} is already registered`, "DUPLICATE_ACCOUNT");
    }
    throw err;
  }
}

export async function userLogin({ identifier, password, clientIp }) {
  const key = attemptKey(ROLES.USER, identifier, clientIp);
  await assertNotLocked(key);

  const id = String(identifier ?? "").trim();
  if (!id || typeof password !== "string" || !password) {
    await recordFailure(key);
    throw new AuthError("Invalid credentials");
  }

  const user = id.includes("@")
    ? await userRepository.findByEmail(id)
    : await userRepository.findByUsername(id);

  if (!user) {
    await burnTiming(password);
    await recordFailure(key);
    throw new AuthError("Invalid credentials");
  }

  const ok = await verifySecret(password, user.passwordHash);
  if (!ok || user.status !== "active") {
    await recordFailure(key);
    throw new AuthError("Invalid credentials");
  }

  await clearFailures(key);
  const session = await createSession({
    role: ROLES.USER,
    subjectId: user.id,
    meta: { username: user.username },
  });
  return { session, user: toPublicUser(user) };
}

// ---- serialization -----------------------------------------
//
// Spec §3.1/§3.2: never return a PIN or PIN hash through an API. These are the
// only shapes that may leave the server — build responses from them, never
// from a raw record.

export function toPublicPeer(peer) {
  if (!peer) return null;
  const { pinHash, ...rest } = peer;
  return rest;
}

export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}
