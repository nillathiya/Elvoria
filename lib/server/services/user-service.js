// ============================================================
//  User service (spec §2.1) — the admin's read-only view of
//  registered normal users.
//
//  Read-only on purpose. §2.1 grants the admin exactly one power over
//  users — "view normal registered users" — and nothing in the spec
//  lets an admin create, edit, disable or delete one. Registration
//  (§2.3) is the only way a user comes into existence, so there is no
//  write path here to abuse.
// ============================================================

import { userRepository } from "../repositories/user-repository.js";
import { depositRequestRepository } from "../repositories/deposit-request-repository.js";
import { toPublicUser } from "./auth-service.js";

export async function listUsers() {
  const [users, requests] = await Promise.all([
    userRepository.all(),
    depositRequestRepository.all(),
  ]);

  const counts = new Map();
  for (const r of requests) counts.set(r.userId, (counts.get(r.userId) ?? 0) + 1);

  // Built from toPublicUser, never from the raw record: that is the only
  // shape that has passwordHash stripped (§3.3).
  return users.map((user) => ({
    ...toPublicUser(user),
    depositRequests: counts.get(user.id) ?? 0,
  }));
}
