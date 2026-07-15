// ============================================================
//  Phase 2 tests — auth (spec §24 "Authentication Tests").
//  Covers the spec's list verbatim, plus the leaks it implies.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const TMP = await fs.mkdtemp(path.join(os.tmpdir(), "elvoria-auth-test-"));
process.env.STORAGE_DIR = TMP;
process.env.AUTH_PEPPER = "test-pepper-not-a-real-secret";

const { ensureStorage } = await import("../lib/server/services/file-storage-service.js");
const { hashSecret, verifySecret } = await import("../lib/server/utils/crypto-hash.js");
const { peerRepository } = await import("../lib/server/repositories/peer-repository.js");
const auth = await import("../lib/server/services/auth-service.js");
const { clearFailures, attemptKey } = await import("../lib/server/services/rate-limit-service.js");

await ensureStorage();
test.after(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

// Each test gets a distinct IP so one test's lockout cannot fail another.
let ipSeq = 0;
const freshIp = () => `10.0.0.${++ipSeq}`;

async function makePeer({ peerCode, pin, status = "active" }) {
  return peerRepository.create({
    peerCode,
    name: `Peer ${peerCode}`,
    pinHash: await hashSecret(pin),
    status,
  });
}

// ---- hashing -----------------------------------------------

test("PINs are never stored in plain text and salt per-hash", async () => {
  const a = await hashSecret("123456");
  const b = await hashSecret("123456");

  assert.ok(!a.includes("123456"), "the PIN must not appear in its own hash");
  assert.notEqual(a, b, "same PIN hashes differently — salts must be unique");
  assert.ok(await verifySecret("123456", a));
  assert.ok(await verifySecret("123456", b));
  assert.equal(await verifySecret("123457", a), false);
});

test("a hash from a different pepper does not verify", async () => {
  const withPepper = await hashSecret("123456");

  delete process.env.AUTH_PEPPER;
  const unpeppered = await verifySecret("123456", withPepper);
  process.env.AUTH_PEPPER = "test-pepper-not-a-real-secret";

  assert.equal(unpeppered, false, "the pepper must actually take part in the hash");
});

test("verifySecret rejects malformed stored values instead of throwing", async () => {
  for (const bad of [null, undefined, "", "not-a-hash", "scrypt$1$2$3", 42, {}]) {
    assert.equal(await verifySecret("123456", bad), false, `expected false for ${String(bad)}`);
  }
});

// ---- PIN format (spec §24) ---------------------------------

test("admin PIN format: exactly 6 numeric digits", async () => {
  await auth.setAdminPin("246810");

  const rejected = ["12345", "1234567", "abcdef", "12345a", "", "  123456  ", "1.2345", "١٢٣٤٥٦"];
  for (const pin of rejected) {
    await assert.rejects(
      auth.adminLogin({ pin, clientIp: freshIp() }),
      `expected reject: ${JSON.stringify(pin)}`
    );
  }
});

test("a numeric PIN passed as a number is rejected, not coerced", async () => {
  // 012345 as a number would silently become 12345 and lose the leading zero.
  await assert.rejects(auth.adminLogin({ pin: 123456, clientIp: freshIp() }));
});

test("correct admin PIN works, incorrect fails", async () => {
  await auth.setAdminPin("246810");

  const ok = await auth.adminLogin({ pin: "246810", clientIp: freshIp() });
  assert.ok(ok.session.token, "a session token is issued");

  await assert.rejects(auth.adminLogin({ pin: "999999", clientIp: freshIp() }));
});

// ---- peer login (spec §24) ---------------------------------

test("correct peer PIN works, incorrect fails", async () => {
  await makePeer({ peerCode: "PEER001", pin: "654321" });

  const ok = await auth.peerLogin({ peerCode: "PEER001", pin: "654321", clientIp: freshIp() });
  assert.equal(ok.peer.peerCode, "PEER001");
  assert.ok(ok.session.token);

  await assert.rejects(
    auth.peerLogin({ peerCode: "PEER001", pin: "000000", clientIp: freshIp() })
  );
});

test("a disabled peer cannot log in even with the right PIN", async () => {
  await makePeer({ peerCode: "PEER002", pin: "111111", status: "disabled" });

  await assert.rejects(
    auth.peerLogin({ peerCode: "PEER002", pin: "111111", clientIp: freshIp() }),
    /Invalid Peer ID or PIN/
  );
});

test("a disabled peer and a wrong PIN are indistinguishable to a caller", async () => {
  await makePeer({ peerCode: "PEER003", pin: "222222", status: "disabled" });

  const disabled = await auth
    .peerLogin({ peerCode: "PEER003", pin: "222222", clientIp: freshIp() })
    .catch((e) => e.message);
  const unknown = await auth
    .peerLogin({ peerCode: "NOSUCH", pin: "222222", clientIp: freshIp() })
    .catch((e) => e.message);

  // Differing messages would confirm which peer codes exist.
  assert.equal(disabled, unknown, "must not leak whether the account exists");
});

test("peer login never returns the PIN hash", async () => {
  await makePeer({ peerCode: "PEER004", pin: "333333" });

  const { peer } = await auth.peerLogin({
    peerCode: "PEER004",
    pin: "333333",
    clientIp: freshIp(),
  });

  assert.equal(peer.pinHash, undefined, "spec §3.2: never expose the PIN hash");
  assert.ok(!JSON.stringify(peer).includes("scrypt"));
});

test("peer codes are matched case-insensitively", async () => {
  await makePeer({ peerCode: "PEER005", pin: "444444" });

  const ok = await auth.peerLogin({ peerCode: "peer005", pin: "444444", clientIp: freshIp() });
  assert.equal(ok.peer.peerCode, "PEER005");
});

// ---- normal user (spec §24) --------------------------------

test("a normal user can register and log in", async () => {
  const user = await auth.userRegister({
    email: "Someone@Example.com",
    username: "someone",
    password: "correct horse battery",
  });

  assert.equal(user.email, "someone@example.com", "email is normalized to lowercase");
  assert.equal(user.passwordHash, undefined, "never return the password hash");

  const login = await auth.userLogin({
    identifier: "someone@example.com",
    password: "correct horse battery",
    clientIp: freshIp(),
  });
  assert.ok(login.session.token);

  const byUsername = await auth.userLogin({
    identifier: "someone",
    password: "correct horse battery",
    clientIp: freshIp(),
  });
  assert.ok(byUsername.session.token, "username also works as the identifier");
});

test("duplicate registration fails, including by email case", async () => {
  await auth.userRegister({ email: "dupe@example.com", username: "dupe", password: "password123" });

  await assert.rejects(
    auth.userRegister({ email: "dupe@example.com", username: "other", password: "password123" }),
    /already registered/
  );
  await assert.rejects(
    auth.userRegister({ email: "DUPE@EXAMPLE.COM", username: "other2", password: "password123" }),
    /already registered/,
    "casing must not create a second account for the same address"
  );
  await assert.rejects(
    auth.userRegister({ email: "other@example.com", username: "dupe", password: "password123" }),
    /already registered/
  );
});

test("concurrent registration of the same email yields exactly one account", async () => {
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, (_, i) =>
      auth.userRegister({ email: "race@example.com", username: `race${i}`, password: "password123" })
    )
  );

  const created = results.filter((r) => r.status === "fulfilled");
  assert.equal(created.length, 1, "the uniqueness check must hold under concurrency");
});

test("a wrong password fails and registration input is validated", async () => {
  await auth.userRegister({ email: "val@example.com", username: "val", password: "password123" });

  await assert.rejects(
    auth.userLogin({ identifier: "val@example.com", password: "wrong", clientIp: freshIp() })
  );
  await assert.rejects(auth.userRegister({ email: "bad-email", username: "x1", password: "password123" }));
  await assert.rejects(auth.userRegister({ email: "ok@example.com", username: "x2", password: "short" }));
});

// ---- brute force (spec §3.1, §21) --------------------------

test("repeated invalid PINs trigger a temporary lockout", async () => {
  await auth.setAdminPin("246810");
  const ip = freshIp();
  const key = attemptKey("admin", "admin", ip);
  await clearFailures(key);

  for (let i = 0; i < 5; i++) {
    await auth.adminLogin({ pin: "000000", clientIp: ip }).catch(() => {});
  }

  // The correct PIN must now be refused too — otherwise the lock is decorative.
  const err = await auth.adminLogin({ pin: "246810", clientIp: ip }).catch((e) => e);
  assert.equal(err.code, "RATE_LIMITED");
  assert.ok(err.retryAfterSeconds > 0, "the client is told when to retry");
});

test("lockout is scoped per client, so one attacker cannot lock out the real admin", async () => {
  await auth.setAdminPin("246810");

  const attacker = freshIp();
  for (let i = 0; i < 6; i++) {
    await auth.adminLogin({ pin: "000000", clientIp: attacker }).catch(() => {});
  }

  const victim = await auth.adminLogin({ pin: "246810", clientIp: freshIp() });
  assert.ok(victim.session.token, "an unrelated client is unaffected");
});

test("a successful login clears the failure counter", async () => {
  await auth.setAdminPin("246810");
  const ip = freshIp();

  for (let i = 0; i < 3; i++) {
    await auth.adminLogin({ pin: "000000", clientIp: ip }).catch(() => {});
  }
  await auth.adminLogin({ pin: "246810", clientIp: ip });

  // Without a reset, 2 more failures would trip the 5-failure tier.
  for (let i = 0; i < 3; i++) {
    await auth.adminLogin({ pin: "000000", clientIp: ip }).catch(() => {});
  }
  const ok = await auth.adminLogin({ pin: "246810", clientIp: ip });
  assert.ok(ok.session.token);
});

test("malformed PIN attempts still count toward lockout", async () => {
  await auth.setAdminPin("246810");
  const ip = freshIp();

  for (let i = 0; i < 5; i++) {
    await auth.adminLogin({ pin: "abc", clientIp: ip }).catch(() => {});
  }

  const err = await auth.adminLogin({ pin: "246810", clientIp: ip }).catch((e) => e);
  assert.equal(err.code, "RATE_LIMITED", "invalid-format probes must not be free");
});
