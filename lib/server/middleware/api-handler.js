// ============================================================
//  Route wrapper — the one place API errors become HTTP responses.
//
//  Handlers throw typed errors; this decides status and body. Nothing else
//  should build an error response, or messages drift and internals leak.
// ============================================================

import { NextResponse } from "next/server";
import { AppError } from "../utils/errors.js";
import { ensureStorage } from "../services/file-storage-service.js";
import { assertCsrf } from "./csrf.js";
import { assertWithinRateLimit } from "./rate-limit.js";

export function json(data, init) {
  return NextResponse.json(data, init);
}

export function clientIp(request) {
  // Behind a proxy the socket address is the proxy's. Trust the forwarded
  // header only when the deployment says a trusted proxy sets it — otherwise a
  // client could spoof it and sidestep per-IP lockout entirely.
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function withApi(handler) {
  return async (request, context) => {
    try {
      // Order matters: rate limiting first, so a flood is turned away before it
      // costs a CSRF check or any disk work. CSRF next, so an unauthorised
      // cross-site request never reaches a handler. Applied here rather than
      // per-route because a route that forgets to opt in is a hole, and this is
      // the one place every route already passes through.
      assertWithinRateLimit(request, clientIp(request));
      assertCsrf(request);

      await ensureStorage();

      // Next 15+ hands route params in as a Promise. Resolved once here so
      // every controller can keep reading params.id directly — awaiting it in
      // fourteen handlers would be fourteen chances to forget.
      const resolved = context?.params ? { ...context, params: await context.params } : context;

      return await handler(request, resolved);
    } catch (err) {
      if (err instanceof AppError) {
        const body = { error: err.message, code: err.code };
        if (err.details) body.details = err.details;

        const headers = {};
        if (err.retryAfterSeconds) headers["Retry-After"] = String(err.retryAfterSeconds);

        return NextResponse.json(body, { status: err.status, headers });
      }

      // Unexpected: log server-side, return an opaque message. Stack traces and
      // fs paths must never reach a client.
      console.error("[api] unhandled error:", err);
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
