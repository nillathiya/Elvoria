// ============================================================
//  Normal user auth controller (spec §3.3, §22).
//  No email verification, per spec §26.4.
// ============================================================

import { cookies } from "next/headers";
import { json, readJsonBody, clientIp } from "../middleware/api-handler.js";
import { userRegister, userLogin } from "../services/auth-service.js";
import {
  COOKIE_NAMES,
  ROLES,
  cookieOptions,
  clearedCookieOptions,
  destroySession,
} from "../services/session-service.js";
import { requireUser } from "../middleware/auth.js";

export async function userRegisterController(request) {
  const body = await readJsonBody(request);

  const user = await userRegister({
    email: body.email,
    username: body.username,
    password: body.password,
  });

  // Registration does not log you in — a session is minted only by /login,
  // which keeps one path responsible for lockout accounting.
  return json({ ok: true, user: { id: user.id, username: user.username } }, { status: 201 });
}

export async function userLoginController(request) {
  const body = await readJsonBody(request);

  const { session, user } = await userLogin({
    identifier: body.identifier ?? body.email ?? body.username,
    password: body.password,
    clientIp: clientIp(request),
  });

  (await cookies()).set(COOKIE_NAMES[ROLES.USER], session.token, cookieOptions(ROLES.USER, session.maxAge));

  return json({ ok: true, user: { id: user.id, username: user.username, email: user.email } });
}

export async function userLogoutController() {
  const token = (await cookies()).get(COOKIE_NAMES[ROLES.USER])?.value;

  await destroySession(token);
  (await cookies()).set(COOKIE_NAMES[ROLES.USER], "", clearedCookieOptions(ROLES.USER));

  return json({ ok: true });
}

export async function userMeController() {
  const { user } = await requireUser();
  return json({ user: { id: user.id, username: user.username, email: user.email } });
}
