// ============================================================
//  Auth middleware — role gates for route handlers (spec §21 RBAC).
//
//  Every non-public route must call exactly one of these first.
// ============================================================

import { cookies } from "next/headers";
import { getSession, COOKIE_NAMES, ROLES } from "../services/session-service.js";
import { peerRepository } from "../repositories/peer-repository.js";
import { userRepository } from "../repositories/user-repository.js";
import { AuthError, ForbiddenError } from "../utils/errors.js";
import { toPublicPeer, toPublicUser } from "../services/auth-service.js";

async function sessionFor(role) {
  // Next 15 made cookies() async — it must be awaited before .get().
  const store = await cookies();
  const token = store.get(COOKIE_NAMES[role])?.value;

  const session = await getSession(token, role);
  if (!session) throw new AuthError();
  return session;
}

export async function requireAdmin() {
  const session = await sessionFor(ROLES.ADMIN);
  return { role: ROLES.ADMIN, subjectId: session.subjectId };
}

export async function requirePeer() {
  const session = await sessionFor(ROLES.PEER);

  // Re-read the peer on every request: a session minted before the admin
  // disabled them must stop working immediately, not at session expiry.
  const peer = await peerRepository.findById(session.subjectId);
  if (!peer) throw new AuthError();
  if (peer.status !== "active") throw new ForbiddenError("This peer account is disabled");

  return { role: ROLES.PEER, peer: toPublicPeer(peer) };
}

export async function requireUser() {
  const session = await sessionFor(ROLES.USER);

  const user = await userRepository.findById(session.subjectId);
  if (!user) throw new AuthError();
  if (user.status !== "active") throw new ForbiddenError("This account is disabled");

  return { role: ROLES.USER, user: toPublicUser(user) };
}
