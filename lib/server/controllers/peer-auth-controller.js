// ============================================================
//  Peer auth controller (spec §3.2, §22).
//  Peers cannot self-register — there is deliberately no register endpoint.
// ============================================================

import { cookies } from "next/headers";
import { json, readJsonBody, clientIp } from "../middleware/api-handler.js";
import { peerLogin } from "../services/auth-service.js";
import {
  COOKIE_NAMES,
  ROLES,
  cookieOptions,
  clearedCookieOptions,
  destroySession,
} from "../services/session-service.js";
import { requirePeer } from "../middleware/auth.js";

export async function peerLoginController(request) {
  const body = await readJsonBody(request);

  const { session, peer } = await peerLogin({
    peerCode: body.peerCode,
    pin: body.pin,
    clientIp: clientIp(request),
  });

  cookies().set(COOKIE_NAMES[ROLES.PEER], session.token, cookieOptions(ROLES.PEER, session.maxAge));

  // toPublicPeer already stripped pinHash; the panel only needs identity.
  return json({ ok: true, peer: { id: peer.id, peerCode: peer.peerCode, name: peer.name } });
}

export async function peerLogoutController() {
  const token = cookies().get(COOKIE_NAMES[ROLES.PEER])?.value;

  await destroySession(token);
  cookies().set(COOKIE_NAMES[ROLES.PEER], "", clearedCookieOptions(ROLES.PEER));

  return json({ ok: true });
}

export async function peerMeController() {
  const { peer } = await requirePeer();
  return json({ peer: { id: peer.id, peerCode: peer.peerCode, name: peer.name } });
}
