// ============================================================
//  Admin auth controller (spec §22).
// ============================================================

import { cookies } from "next/headers";
import { json, readJsonBody, clientIp } from "../middleware/api-handler.js";
import { adminLogin, isAdminProvisioned } from "../services/auth-service.js";
import {
  COOKIE_NAMES,
  ROLES,
  cookieOptions,
  clearedCookieOptions,
  destroySession,
} from "../services/session-service.js";

export async function adminLoginController(request) {
  const body = await readJsonBody(request);

  const { session } = await adminLogin({ pin: body.pin, clientIp: clientIp(request) });

  cookies().set(COOKIE_NAMES[ROLES.ADMIN], session.token, cookieOptions(ROLES.ADMIN, session.maxAge));

  // No PIN, no hash, no token in the body — the cookie is the only carrier.
  return json({ ok: true, role: ROLES.ADMIN });
}

export async function adminLogoutController() {
  const token = cookies().get(COOKIE_NAMES[ROLES.ADMIN])?.value;

  // Delete the session file too — clearing the cookie alone would leave a
  // token that still works if it was captured.
  await destroySession(token);
  cookies().set(COOKIE_NAMES[ROLES.ADMIN], "", clearedCookieOptions(ROLES.ADMIN));

  return json({ ok: true });
}

export async function adminStatusController() {
  return json({ provisioned: await isAdminProvisioned() });
}
