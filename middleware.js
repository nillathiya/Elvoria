// ============================================================
//  Edge middleware — issues the CSRF token cookie (spec §21).
//
//  This runs before every page and API request, so the token exists by the
//  time any form can be submitted. A route handler cannot do this job: the
//  login page is the first thing a visitor loads, and it must already have a
//  token to post with.
// ============================================================

import { NextResponse } from "next/server";

export const CSRF_COOKIE = "elvoria_csrf";

export function middleware(request) {
  const response = NextResponse.next();

  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, crypto.randomUUID(), {
      // Readable by JS on purpose: this is the double-submit pattern — the
      // client must echo it in a header, which an attacker's site cannot do
      // because it cannot read our cookies (same-origin policy) and cannot set
      // custom headers cross-origin without a preflight we do not allow.
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
}

export const config = {
  // Skip static assets and image optimisation — they neither need nor benefit
  // from a token, and running middleware on them is pure overhead.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|apple-icon|logo|sw.js|manifest).*)"],
};
