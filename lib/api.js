// ============================================================
//  Client-side API helper.
//
//  The SESSION rides on an HTTP-only cookie, so there is no session token to
//  attach here — and no way for this code (or an XSS payload) to read one.
//
//  The CSRF token is the opposite: deliberately readable, because the server
//  checks that we echoed it back in a header. Only same-origin JS can read the
//  cookie, which is exactly the property that makes the check meaningful.
// ============================================================

const CSRF_COOKIE = "elvoria_csrf";

function csrfToken() {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";

  // Only sent on state-changing requests — the server ignores it on GET.
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = csrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(path, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body }),
  put: (path, body) => apiFetch(path, { method: "PUT", body }),
  patch: (path, body) => apiFetch(path, { method: "PATCH", body }),
  del: (path) => apiFetch(path, { method: "DELETE" }),
};
