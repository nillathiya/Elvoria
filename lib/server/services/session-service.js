// ============================================================
//  File-based sessions (spec §21 — secure sessions, HTTP-only cookies).
//
//  The cookie carries a random token. On disk we store only sha256(token),
//  so a leaked storage/sessions/ directory cannot be replayed as a login —
//  same reason passwords are hashed.
// ============================================================

import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { DIRS } from "../config/storage-config.js";
import { atomicWriteJson, readJson } from "../utils/atomic-write.js";
import { randomToken } from "../utils/crypto-hash.js";

export const ROLES = { ADMIN: "admin", PEER: "peer", USER: "user" };

// Admin/peer sessions are short: they hold destructive power and a 6-digit PIN.
const TTL_MS = {
  [ROLES.ADMIN]: 60 * 60 * 1000, // 1h
  [ROLES.PEER]: 8 * 60 * 60 * 1000, // 8h
  [ROLES.USER]: 7 * 24 * 60 * 60 * 1000, // 7d
};

export const COOKIE_NAMES = {
  [ROLES.ADMIN]: "elvoria_admin_session",
  [ROLES.PEER]: "elvoria_peer_session",
  [ROLES.USER]: "elvoria_user_session",
};

function fileFor(token) {
  return path.join(DIRS.sessions, `${createHash("sha256").update(token).digest("hex")}.json`);
}

export async function createSession({ role, subjectId, meta = {} }) {
  await fs.mkdir(DIRS.sessions, { recursive: true });

  const token = randomToken(32);
  const now = Date.now();
  await atomicWriteJson(fileFor(token), {
    role,
    subjectId,
    meta,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS[role]).toISOString(),
  });

  return { token, maxAge: Math.floor(TTL_MS[role] / 1000) };
}

export async function getSession(token, expectedRole) {
  if (!token) return null;

  const session = await readJson(fileFor(token), null);
  if (!session) return null;

  if (Date.now() > Date.parse(session.expiresAt)) {
    await destroySession(token);
    return null;
  }

  // A peer cookie must never satisfy an admin check, even if both are present.
  if (expectedRole && session.role !== expectedRole) return null;

  return session;
}

export async function destroySession(token) {
  if (!token) return;
  await fs.rm(fileFor(token), { force: true }).catch(() => {});
}

export function cookieOptions(role, maxAge) {
  return {
    httpOnly: true, // JS can't read it, so XSS can't exfiltrate the session
    sameSite: "lax", // blocks cross-site POSTs from riding the cookie (CSRF)
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function clearedCookieOptions(role) {
  return { ...cookieOptions(role, 0), maxAge: 0 };
}
