// ============================================================
//  Phase 8 tests — CSRF, rate limiting, file corruption recovery (spec §21).
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const TMP = await fs.mkdtemp(path.join(os.tmpdir(), "elvoria-hardening-test-"));
process.env.STORAGE_DIR = TMP;
process.env.AUTH_PEPPER = "test-pepper";

const { assertCsrf, CSRF_COOKIE, CSRF_HEADER } = await import("../lib/server/middleware/csrf.js");
const { assertWithinRateLimit, resetRateLimits } = await import(
  "../lib/server/middleware/rate-limit.js"
);
const { ensureStorage, readCollection, insert } = await import(
  "../lib/server/services/file-storage-service.js"
);
const { backupPathFor } = await import("../lib/server/utils/atomic-write.js");
const { consumedTxHashRepository } = await import(
  "../lib/server/repositories/consumed-txhash-repository.js"
);

await ensureStorage();
test.after(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

const TOKEN = "11111111-2222-3333-4444-555555555555";

function req(url, { method = "POST", cookie, csrf, origin, referer } = {}) {
  const headers = {};
  if (cookie !== undefined) headers.cookie = cookie;
  if (csrf !== undefined) headers[CSRF_HEADER] = csrf;
  if (origin !== undefined) headers.origin = origin;
  if (referer !== undefined) headers.referer = referer;
  headers.host = "elvoria.test";

  return new Request(url, { method, headers });
}

const URL_ = "http://elvoria.test/api/user/login";

// ---- CSRF (spec §21) ---------------------------------------

test("a state-changing request without a CSRF token is refused", () => {
  assert.throws(() => assertCsrf(req(URL_)), { code: "CSRF_FAILED" });
});

test("a token in the header but no cookie is refused", () => {
  // This is the shape of a forged request: the attacker guesses a value but
  // cannot make the browser hold a matching cookie.
  assert.throws(() => assertCsrf(req(URL_, { csrf: TOKEN })), { code: "CSRF_FAILED" });
});

test("a cookie with no header is refused", () => {
  // The browser sends cookies automatically on a cross-site POST; only the
  // header proves same-origin JS made the request.
  assert.throws(() => assertCsrf(req(URL_, { cookie: `${CSRF_COOKIE}=${TOKEN}` })), {
    code: "CSRF_FAILED",
  });
});

test("a mismatched token is refused", () => {
  assert.throws(
    () => assertCsrf(req(URL_, { cookie: `${CSRF_COOKIE}=${TOKEN}`, csrf: "different-value-here" })),
    { code: "CSRF_FAILED" }
  );
});

test("a matching cookie and header passes", () => {
  assert.doesNotThrow(() =>
    assertCsrf(req(URL_, { cookie: `${CSRF_COOKIE}=${TOKEN}`, csrf: TOKEN }))
  );
});

test("the token is found among other cookies", () => {
  assert.doesNotThrow(() =>
    assertCsrf(
      req(URL_, {
        cookie: `elvoria_user_session=abc; ${CSRF_COOKIE}=${TOKEN}; theme=dark`,
        csrf: TOKEN,
      })
    )
  );
});

test("safe methods need no token", () => {
  for (const method of ["GET", "HEAD", "OPTIONS"]) {
    assert.doesNotThrow(() => assertCsrf(req(URL_, { method })), `${method} must not need a token`);
  }
});

test("a cross-site origin is refused even with a valid token pair", () => {
  // Belt and braces: if a token ever leaks, the origin check still holds.
  assert.throws(
    () =>
      assertCsrf(
        req(URL_, { cookie: `${CSRF_COOKIE}=${TOKEN}`, csrf: TOKEN, origin: "https://evil.example" })
      ),
    { code: "CSRF_FAILED" }
  );
});

test("a cross-site referer is refused when origin is absent", () => {
  assert.throws(
    () =>
      assertCsrf(
        req(URL_, {
          cookie: `${CSRF_COOKIE}=${TOKEN}`,
          csrf: TOKEN,
          referer: "https://evil.example/attack.html",
        })
      ),
    { code: "CSRF_FAILED" }
  );
});

test("a same-origin request passes the origin check", () => {
  assert.doesNotThrow(() =>
    assertCsrf(
      req(URL_, { cookie: `${CSRF_COOKIE}=${TOKEN}`, csrf: TOKEN, origin: "http://elvoria.test" })
    )
  );
});

test("a garbled origin header is refused rather than ignored", () => {
  assert.throws(
    () => assertCsrf(req(URL_, { cookie: `${CSRF_COOKIE}=${TOKEN}`, csrf: TOKEN, origin: "not a url" })),
    { code: "CSRF_FAILED" }
  );
});

// ---- rate limiting (spec §21) ------------------------------

test("requests are allowed up to the limit, then refused", () => {
  resetRateLimits();
  const request = new Request("http://elvoria.test/api/admin/peers", { method: "GET" });

  for (let i = 0; i < 120; i++) {
    assert.doesNotThrow(() => assertWithinRateLimit(request, "1.1.1.1"), `blocked at ${i}`);
  }

  let err;
  try {
    assertWithinRateLimit(request, "1.1.1.1");
  } catch (e) {
    err = e;
  }

  assert.ok(err, "the 121st request must be refused");
  assert.equal(err.code, "RATE_LIMITED");
  assert.ok(err.retryAfterSeconds > 0, "the client is told when to retry");
});

test("verify-tx has a tighter budget than general API calls", () => {
  resetRateLimits();
  const request = new Request("http://elvoria.test/api/peer/verify-tx", { method: "POST" });

  // Each call hits a blockchain node, so 10/min rather than 120/min.
  for (let i = 0; i < 10; i++) {
    assert.doesNotThrow(() => assertWithinRateLimit(request, "2.2.2.2"), `blocked at ${i}`);
  }
  assert.throws(() => assertWithinRateLimit(request, "2.2.2.2"), { code: "RATE_LIMITED" });
});

test("one client hitting its limit does not affect another", () => {
  resetRateLimits();
  const request = new Request("http://elvoria.test/api/peer/verify-tx", { method: "POST" });

  for (let i = 0; i < 11; i++) {
    try {
      assertWithinRateLimit(request, "3.3.3.3");
    } catch {}
  }

  assert.doesNotThrow(() => assertWithinRateLimit(request, "4.4.4.4"));
});

test("rate limit buckets are per rule, not shared", () => {
  resetRateLimits();
  const verify = new Request("http://elvoria.test/api/peer/verify-tx", { method: "POST" });
  const general = new Request("http://elvoria.test/api/admin/peers", { method: "GET" });

  for (let i = 0; i < 10; i++) assertWithinRateLimit(verify, "5.5.5.5");
  assert.throws(() => assertWithinRateLimit(verify, "5.5.5.5"));

  // Exhausting verify must not lock the same client out of everything else.
  assert.doesNotThrow(() => assertWithinRateLimit(general, "5.5.5.5"));
});

// ---- file corruption (spec Phase 8) ------------------------

test("a corrupt collection file raises a typed error instead of reading empty", async () => {
  await insert("users", { id: "user_keep", email: "keep@example.com" });

  const file = path.join(TMP, "users.json");
  await fs.writeFile(file, "{ this is not json", "utf8");

  const err = await readCollection("users").catch((e) => e);
  assert.equal(err.code, "STORAGE_CORRUPT");
  assert.ok(err.filePath.endsWith("users.json"));
});

test("an empty file is treated as corruption, not as an empty collection", async () => {
  const file = path.join(TMP, "users.json");
  await fs.writeFile(file, "", "utf8");

  // Atomic writes never produce zero bytes, so an empty file means something
  // else damaged it. Reading it as "no users" would be a silent data loss.
  const err = await readCollection("users").catch((e) => e);
  assert.equal(err.code, "STORAGE_CORRUPT");
});

test("a corrupt consumed registry can never be read as 'nothing consumed'", async () => {
  const key = "BSC:aaaa";
  await consumedTxHashRepository.create({ registryKey: key, peerId: "peer_1" });

  await fs.writeFile(path.join(TMP, "consumed-txhashes.json"), "[ {broken", "utf8");

  // This is the whole reason corruption fails closed. If a damaged registry
  // read as an empty list, every previously claimed TX hash would become
  // claimable again — a disk fault would turn into a double-spend.
  const err = await consumedTxHashRepository.isConsumed(key).catch((e) => e);
  assert.equal(err.code, "STORAGE_CORRUPT", "must refuse to answer rather than say 'not consumed'");
});

test("a backup of the previous version is kept and restores cleanly", async () => {
  const file = path.join(TMP, "peers.json");

  await insert("peers", { id: "peer_a", peerCode: "PEERA" });
  await insert("peers", { id: "peer_b", peerCode: "PEERB" }); // backs up the 1-row version

  const backup = JSON.parse(await fs.readFile(backupPathFor(file), "utf8"));
  assert.equal(backup.length, 1, "the .bak holds the version before the last write");

  // Corrupt the live file, then recover from the backup.
  await fs.writeFile(file, "garbage", "utf8");
  await assert.rejects(readCollection("peers"), { code: "STORAGE_CORRUPT" });

  await fs.copyFile(backupPathFor(file), file);
  const restored = await readCollection("peers");
  assert.equal(restored.length, 1, "the backup is valid JSON and readable");
  assert.equal(restored[0].peerCode, "PEERA");
});

test("a missing file is still normal and reads as empty", async () => {
  await fs.rm(path.join(TMP, "deposit-requests.json"), { force: true });

  // Only ENOENT may fall back — a fresh install has no files yet.
  assert.deepEqual(await readCollection("depositRequests"), []);
});
