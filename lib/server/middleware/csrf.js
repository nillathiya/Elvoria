// ============================================================
//  CSRF protection for state-changing requests (spec §21).
//
//  Two independent checks, because each covers the other's gap:
//
//   1. Origin/Referer must match this host. Cheap and catches the common case,
//      but some legitimate clients omit both headers.
//   2. Double-submit token: a header value must equal the cookie value. A
//      cross-site attacker can make the browser SEND our cookies, but cannot
//      READ them to copy into a header, and cannot set a custom header
//      cross-origin without a CORS preflight we never approve.
//
//  SameSite=lax on the session cookie already blocks most of this, but it is a
//  browser-side default we do not control and does not cover every client, so
//  it is a layer rather than the answer.
// ============================================================

import { timingSafeEqual } from "crypto";
import { CsrfError } from "../utils/errors.js";

export const CSRF_COOKIE = "elvoria_csrf";
export const CSRF_HEADER = "x-csrf-token";

// GET/HEAD/OPTIONS must not change state, so they need no token.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Read from the Cookie header rather than next/headers, so this is a pure
// function of the request and can be tested directly — the CSRF check is the
// last code that should be hard to exercise.
function cookieValue(request, name) {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function originMatches(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Neither header present: fall through to the token check rather than
  // failing, since some non-browser clients omit both.
  if (!origin && !referer) return true;

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    const source = new URL(origin || referer);
    return source.host === host;
  } catch {
    return false;
  }
}

export function assertCsrf(request) {
  if (SAFE_METHODS.has(request.method)) return;

  if (!originMatches(request)) {
    throw new CsrfError("Request origin does not match this site");
  }

  const cookieToken = cookieValue(request, CSRF_COOKIE);
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    throw new CsrfError("Missing or invalid CSRF token");
  }
}
