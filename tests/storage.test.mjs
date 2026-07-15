// ============================================================
//  Phase 1 tests — file storage, atomic writes, locking.
//
//  The headline case is "two simultaneous requests for the same TX hash
//  cannot both succeed" (spec §24, §26.12). Everything else guards the
//  primitives that guarantee it.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { fork } from "child_process";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// STORAGE_ROOT is resolved at module load, so the env var must be set before
// the modules under test are imported.
const TMP = await fs.mkdtemp(path.join(os.tmpdir(), "elvoria-storage-test-"));
process.env.STORAGE_DIR = TMP;

const { ensureStorage, mutateCollection, readCollection, insert } = await import(
  "../lib/server/services/file-storage-service.js"
);
const { withLock } = await import("../lib/server/utils/file-lock.js");
const { normalizeTxHash } = await import("../lib/server/utils/hash-normalizer.js");
const { normalizeAddress, addressesEqual } = await import(
  "../lib/server/utils/address-normalizer.js"
);
const { consumedTxHashRepository } = await import(
  "../lib/server/repositories/consumed-txhash-repository.js"
);

await ensureStorage();

test.after(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

// ---- atomic writes / lost updates --------------------------

test("concurrent inserts do not lose records", async () => {
  const N = 40;
  await Promise.all(
    Array.from({ length: N }, (_, i) => insert("users", { id: `user_${i}`, n: i }))
  );

  const rows = await readCollection("users");
  assert.equal(rows.length, N, "every concurrent insert must survive");
  assert.equal(new Set(rows.map((r) => r.id)).size, N, "no duplicates, no clobbered ids");
});

test("a read-modify-write under load never interleaves", async () => {
  await insert("depositMethods", { id: "counter", count: 0 });

  const BUMPS = 30;
  await Promise.all(
    Array.from({ length: BUMPS }, () =>
      mutateCollection("depositMethods", (rows) => {
        const next = rows.map((r) => (r.id === "counter" ? { ...r, count: r.count + 1 } : r));
        return { rows: next };
      })
    )
  );

  const [counter] = await readCollection("depositMethods");
  assert.equal(counter.count, BUMPS, "each increment saw the previous one's write");
});

test("collection file is always valid JSON, never truncated", async () => {
  const raw = await fs.readFile(path.join(TMP, "users.json"), "utf8");
  assert.doesNotThrow(() => JSON.parse(raw));
});

// ---- locking -----------------------------------------------

test("withLock serializes holders of the same lock name", async () => {
  let active = 0;
  let maxActive = 0;

  await Promise.all(
    Array.from({ length: 12 }, () =>
      withLock("same-name", async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active -= 1;
      })
    )
  );

  assert.equal(maxActive, 1, "only one holder may be inside the lock at a time");
});

test("different lock names do not block each other", async () => {
  const order = [];
  await Promise.all([
    withLock("lock-a", async () => {
      await new Promise((r) => setTimeout(r, 30));
      order.push("a");
    }),
    withLock("lock-b", async () => {
      order.push("b");
    }),
  ]);

  assert.deepEqual(order, ["b", "a"], "lock-b must not wait on the slower lock-a");
});

test("lock is released even when the body throws", async () => {
  await assert.rejects(withLock("throwing", async () => {
    throw new Error("boom");
  }));

  // If the lock leaked, this would block until the acquire timeout.
  await withLock("throwing", async () => {}, { timeoutMs: 1000 });
});

test("a TX-hash lock name cannot escape the locks directory", async () => {
  await withLock("../../../etc/passwd", async () => {});
  const entries = await fs.readdir(path.join(TMP, "locks"));
  assert.ok(
    entries.every((e) => /^[0-9a-f]{64}\.lock$/.test(e)),
    "lock names must be hashed, not used as raw paths"
  );
});

// ---- the guarantee -----------------------------------------

// Mirrors the Phase 7 claim flow: check the registry, lock, re-check inside
// the lock, then claim. Only the re-check inside the lock makes it safe.
async function claimTxHash(registryKey, peerId) {
  if (await consumedTxHashRepository.isConsumed(registryKey)) return { ok: false };

  return withLock(`txhash:${registryKey}`, async () => {
    if (await consumedTxHashRepository.isConsumed(registryKey)) return { ok: false };
    await consumedTxHashRepository.create({ registryKey, peerId });
    return { ok: true, peerId };
  });
}

test("concurrent claims of the same TX hash: exactly one wins", async () => {
  const key = "BSC:aa11bb22cc33dd44ee55ff66aa77bb88cc99dd00ee11ff22aa33bb44cc55dd66";

  const results = await Promise.all(
    Array.from({ length: 15 }, (_, i) => claimTxHash(key, `peer_${i}`))
  );

  const winners = results.filter((r) => r.ok);
  assert.equal(winners.length, 1, "exactly one peer may claim a TX hash");

  const consumed = await consumedTxHashRepository.find((c) => c.registryKey === key);
  assert.equal(consumed.length, 1, "registry holds exactly one entry for the hash");
  assert.equal(consumed[0].peerId, winners[0].peerId, "the winner is the peer recorded");
});

test("a TX hash is permanently tied to the first peer", async () => {
  const key = "BSC:1111111111111111111111111111111111111111111111111111111111111111";

  const first = await claimTxHash(key, "peer_first");
  const second = await claimTxHash(key, "peer_second");

  assert.equal(first.ok, true);
  assert.equal(second.ok, false, "a different peer must be rejected as already used");

  const entry = await consumedTxHashRepository.findByRegistryKey(key);
  assert.equal(entry.peerId, "peer_first", "ownership never transfers");
});

test("claims are exclusive across separate processes, not just async tasks", async () => {
  const key = "BSC:2222222222222222222222222222222222222222222222222222222222222222";
  const WORKERS = 6;

  const results = await Promise.all(
    Array.from({ length: WORKERS }, (_, i) => {
      const child = fork(path.join(HERE, "helpers", "claim-worker.mjs"), [key, `peer_p${i}`], {
        env: { ...process.env, STORAGE_DIR: TMP },
        stdio: ["ignore", "pipe", "pipe", "ipc"],
      });
      return new Promise((resolve, reject) => {
        child.once("message", resolve);
        child.once("error", reject);
      });
    })
  );

  const winners = results.filter((r) => r.ok);
  assert.equal(winners.length, 1, "the lock must hold across OS processes");

  const consumed = await consumedTxHashRepository.find((c) => c.registryKey === key);
  assert.equal(consumed.length, 1);
});

// ---- normalization -----------------------------------------

test("TX hash case and 0x prefix normalize to one registry key", async () => {
  const upper = normalizeTxHash(
    "0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
    "BSC"
  );
  const lower = normalizeTxHash(
    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "BSC"
  );

  assert.equal(upper.registryKey, lower.registryKey, "same tx must not claim twice via casing");
  assert.equal(upper.canonical, `0x${upper.bare}`, "EVM RPC form keeps the 0x prefix");
});

test("the same 32 bytes on different networks are different registry keys", () => {
  const bare = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
  assert.notEqual(
    normalizeTxHash(bare, "BSC").registryKey,
    normalizeTxHash(bare, "TRON").registryKey
  );
  assert.equal(normalizeTxHash(bare, "TRON").canonical, bare, "Tron form carries no 0x prefix");
});

test("malformed TX hashes are rejected", () => {
  for (const bad of ["", "0x", "not-a-hash", "0x123", "0x" + "g".repeat(64), "0x" + "a".repeat(63)]) {
    assert.throws(() => normalizeTxHash(bad, "BSC"), `expected reject: ${JSON.stringify(bad)}`);
  }
});

test("EVM addresses compare case-insensitively, Tron does not", () => {
  assert.ok(
    addressesEqual(
      "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
      "0x8ba1f109551bd432803012645ac136ddd64dba72",
      "BSC"
    ),
    "EIP-55 checksum casing is not a different address"
  );

  const tron = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
  assert.equal(normalizeAddress(tron, "TRON"), tron, "base58 casing is significant");
  assert.throws(() => normalizeAddress(tron.toLowerCase(), "TRON"));
});

test("addresses from the wrong network are rejected", () => {
  assert.throws(() => normalizeAddress("0x8ba1f109551bd432803012645ac136ddd64dba72", "TRON"));
  assert.throws(() => normalizeAddress("TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", "BSC"));
});
