// ============================================================
//  Admin user monitoring controller (spec §2.1, §22).
//  Admin-gated and read-only — mirrors peer-controller, minus every
//  management verb, because §2.1 grants viewing and nothing else.
// ============================================================

import { json } from "../middleware/api-handler.js";
import { requireAdmin } from "../middleware/auth.js";
import { listUsers } from "../services/user-service.js";

export async function listUsersController() {
  await requireAdmin();
  return json({ users: await listUsers() });
}
