// ============================================================
//  Phase 6-7 tests — blockchain verification, TX ownership, duplicates.
//  Covers the spec §24 "Peer TX Verification Tests" list.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

import {
  makeChain,
  installFakeChain,
  installDeadChain,
  transferLog,
  toHex,
  pad32,
} from "./helpers/fake-chain.mjs";

const TMP = await fs.mkdtemp(path.join(os.tmpdir(), "elvoria-verify-test-"));
process.env.STORAGE_DIR = TMP;
process.env.AUTH_PEPPER = "test-pepper";

const { ensureStorage } = await import("../lib/server/services/file-storage-service.js");
const deposits = await import("../lib/server/services/deposit-service.js");
const peersSvc = await import("../lib/server/services/peer-service.js");
const { verifyTxHash, listTransactions } = await import(
  "../lib/server/services/transaction-service.js"
);
const { consumedTxHashRepository } = await import(
  "../lib/server/repositories/consumed-txhash-repository.js"
);
const { TX_STATUS, REASONS } = await import("../lib/server/utils/errors.js");

await ensureStorage();
test.after(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

const USDT = "0x55d398326f99059ff775485246999027b3197955";
const USDT_ETH = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const OUR_ADDRESS = "0x1111111111111111111111111111111111111111";
const OUTSIDE_ADDRESS = "0x9999999999999999999999999999999999999999";
const SENDER = "0xabababababababababababababababababababab";
const OTHER_TOKEN = "0xdddddddddddddddddddddddddddddddddddddddd";

// 100 USDT at 18 decimals.
const HUNDRED = 100n * 10n ** 18n;

const hash = (n) => "0x" + String(n).repeat(64).slice(0, 64);

await deposits.createMethod({
  id: "usdt_bep20",
  name: "USDT BEP20",
  network: "BSC",
  assetType: "token",
  symbol: "USDT",
  contractAddress: USDT,
  decimals: 18,
  requiredConfirmations: 5,
  verifier: "bsc-token-verifier",
});
await deposits.addAddresses("usdt_bep20", OUR_ADDRESS);

await deposits.createMethod({
  id: "bnb_native",
  name: "BNB",
  network: "BSC",
  assetType: "native",
  symbol: "BNB",
  decimals: 18,
  requiredConfirmations: 5,
  verifier: "bsc-native-verifier",
});
await deposits.addAddresses("bnb_native", OUR_ADDRESS);

const peerA = await peersSvc.createPeer({ peerCode: "PEERA", name: "Peer A", pin: "111111" });
const peerB = await peersSvc.createPeer({ peerCode: "PEERB", name: "Peer B", pin: "222222" });

// A confirmed, successful token transfer paying us 100 USDT.
function goodTokenTx(blockNumber = 95) {
  return {
    tx: { from: SENDER, to: USDT, value: "0x0", blockNumber: toHex(blockNumber) },
    receipt: {
      status: "0x1",
      blockNumber: toHex(blockNumber),
      logs: [transferLog({ contract: USDT, from: SENDER, to: OUR_ADDRESS, amount: HUNDRED })],
    },
  };
}

function withChain(transactions, tip = 100) {
  return installFakeChain(makeChain({ tip, transactions }));
}

// ---- the happy path ----------------------------------------

test("a valid TX hash is accepted and every field comes from the chain", async () => {
  const h = hash(1);
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.VERIFIED);
    const tx = result.transaction;

    assert.equal(tx.sender, SENDER, "sender read from the Transfer event");
    assert.equal(tx.recipient, OUR_ADDRESS);
    assert.equal(tx.amount, "100", "raw units converted with the method's decimals");
    assert.equal(tx.amountRaw, HUNDRED.toString(), "raw value kept as a string, never a float");
    assert.equal(typeof tx.amountRaw, "string");
    assert.equal(tx.blockNumber, 95);
    assert.equal(tx.confirmations, 6, "100 - 95 + 1");
    assert.equal(tx.tokenContract, USDT);
    assert.equal(tx.peerId, peerA.id);
    assert.ok(tx.verifiedAt, "verification timestamp is recorded (§11)");
  } finally {
    restore();
  }
});

test("submitted amount/sender/recipient in the request body are ignored", async () => {
  const h = hash(2);
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    // Spec §26.14: none of these may influence the outcome.
    const result = await verifyTxHash({
      peerId: peerA.id,
      methodId: "usdt_bep20",
      txHash: h,
      amount: "999999",
      sender: OUTSIDE_ADDRESS,
      recipient: OUTSIDE_ADDRESS,
      confirmations: 9999,
      status: "verified",
    });

    assert.equal(result.transaction.amount, "100", "the chain's amount wins");
    assert.equal(result.transaction.recipient, OUR_ADDRESS);
    assert.equal(result.transaction.confirmations, 6);
  } finally {
    restore();
  }
});

// ---- rejections (spec §24) ---------------------------------

test("a malformed TX hash is rejected before any network call", async () => {
  const restore = installDeadChain(); // proves no RPC is attempted

  try {
    for (const bad of ["", "0x123", "nope", "0x" + "z".repeat(64)]) {
      await assert.rejects(
        verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: bad }),
        `expected reject for ${JSON.stringify(bad)}`
      );
    }
  } finally {
    restore();
  }
});

test("a nonexistent TX hash is rejected", async () => {
  const restore = withChain({});

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: hash(3) });

    assert.equal(result.status, TX_STATUS.REJECTED);
    assert.equal(result.reason, REASONS.TX_NOT_FOUND);
  } finally {
    restore();
  }
});

test("a failed (reverted) transaction is rejected", async () => {
  const h = hash(4);
  const restore = withChain({
    [h]: {
      tx: { from: SENDER, to: USDT, value: "0x0", blockNumber: toHex(95) },
      // Reverted: on-chain and it cost gas, but it moved nothing.
      receipt: { status: "0x0", blockNumber: toHex(95), logs: [] },
    },
  });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.REJECTED);
    assert.equal(result.reason, REASONS.TRANSACTION_FAILED);
  } finally {
    restore();
  }
});

test("a transfer to an outside address is rejected", async () => {
  const h = hash(5);
  const restore = withChain({
    [h]: {
      tx: { from: SENDER, to: USDT, value: "0x0", blockNumber: toHex(95) },
      receipt: {
        status: "0x1",
        blockNumber: toHex(95),
        logs: [transferLog({ contract: USDT, from: SENDER, to: OUTSIDE_ADDRESS, amount: HUNDRED })],
      },
    },
  });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.REJECTED);
    assert.equal(result.reason, REASONS.WRONG_RECIPIENT);
  } finally {
    restore();
  }
});

// Spec §24 "Wrong network is rejected", §26.13. A hash is just 32 bytes — the
// same string is a plausible hash on every EVM chain. What makes it valid here
// is the chain the method names actually having it.
test("wrong network is rejected, does not claim the hash, and the right one still verifies", async () => {
  await deposits.createMethod({
    id: "usdt_erc20",
    name: "USDT ERC20",
    network: "ETH",
    assetType: "token",
    symbol: "USDT",
    contractAddress: USDT_ETH,
    decimals: 6,
    requiredConfirmations: 5,
    verifier: "eth-token-verifier",
  });
  await deposits.addAddresses("usdt_erc20", OUR_ADDRESS);

  // hash(0)-hash(9) are spoken for; this test verifies for real at the end, so
  // it must own a hash no other test submits.
  const h = hash(10);
  // The transaction exists on BSC and nowhere else.
  const restore = installFakeChain(
    makeChain({ tip: 100, transactions: { [h]: goodTokenTx() }, host: "bsc-dataseed" })
  );

  try {
    const wrong = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_erc20", txHash: h });

    assert.equal(wrong.status, TX_STATUS.REJECTED, "Ethereum has never heard of this hash");
    assert.equal(wrong.reason, REASONS.TX_NOT_FOUND);

    // §11: a wrong-network guess must not burn the hash on the chain it was
    // wrongly submitted against...
    assert.equal(await consumedTxHashRepository.isConsumed(`ETH:${h.slice(2)}`), false);

    // ...and, the point of the test: the hash is still good on the network it
    // really belongs to. A rejection here must not cost the real deposit.
    const right = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(right.status, TX_STATUS.VERIFIED);
    assert.equal(await consumedTxHashRepository.isConsumed(`BSC:${h.slice(2)}`), true);
  } finally {
    restore();
  }
});

test("a transfer of the wrong token is rejected", async () => {
  const h = hash(6);
  const restore = withChain({
    [h]: {
      tx: { from: SENDER, to: OTHER_TOKEN, value: "0x0", blockNumber: toHex(95) },
      // Right recipient, right amount, WRONG contract — a worthless token sent
      // to our address must not be credited as USDT.
      receipt: {
        status: "0x1",
        blockNumber: toHex(95),
        logs: [transferLog({ contract: OTHER_TOKEN, from: SENDER, to: OUR_ADDRESS, amount: HUNDRED })],
      },
    },
  });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.REJECTED);
    assert.equal(result.reason, REASONS.WRONG_TOKEN_CONTRACT);
  } finally {
    restore();
  }
});

test("a token transfer is not accepted by the native verifier", async () => {
  const h = hash(7);
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    // value is 0x0 — the funds moved through the contract, not as BNB.
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "bnb_native", txHash: h });

    assert.equal(result.status, TX_STATUS.REJECTED);
    assert.equal(result.reason, REASONS.WRONG_RECIPIENT, "top-level `to` is the contract, not us");
  } finally {
    restore();
  }
});

test("a token contract paying us is not creditable via the top-level `to` field", async () => {
  const h = hash(8);
  const restore = withChain({
    [h]: {
      // Spec §16: `to` is our address, but the Transfer event pays someone
      // else. Trusting `to` would credit a deposit we never received.
      tx: { from: SENDER, to: OUR_ADDRESS, value: "0x0", blockNumber: toHex(95) },
      receipt: {
        status: "0x1",
        blockNumber: toHex(95),
        logs: [transferLog({ contract: USDT, from: SENDER, to: OUTSIDE_ADDRESS, amount: HUNDRED })],
      },
    },
  });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.REJECTED);
    assert.equal(result.reason, REASONS.WRONG_RECIPIENT);
  } finally {
    restore();
  }
});

test("the correct leg is credited when one transaction emits many transfers", async () => {
  const h = hash(9);
  const restore = withChain({
    [h]: {
      tx: { from: SENDER, to: USDT, value: "0x0", blockNumber: toHex(95) },
      receipt: {
        status: "0x1",
        blockNumber: toHex(95),
        logs: [
          transferLog({ contract: USDT, from: SENDER, to: OUTSIDE_ADDRESS, amount: 5n * 10n ** 18n }),
          transferLog({ contract: OTHER_TOKEN, from: SENDER, to: OUR_ADDRESS, amount: 7n * 10n ** 18n }),
          transferLog({ contract: USDT, from: SENDER, to: OUR_ADDRESS, amount: HUNDRED }),
        ],
      },
    },
  });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.VERIFIED);
    assert.equal(result.transaction.amount, "100", "credits our USDT leg, not the decoys");
  } finally {
    restore();
  }
});

// ---- confirmations (spec §17, §24) -------------------------

test("insufficient confirmations return pending, not verified or rejected", async () => {
  const h = hash(0);
  const restore = withChain({ [h]: goodTokenTx(99) }); // tip 100 -> 2 confirmations

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.PENDING_CONFIRMATIONS);
    assert.equal(result.confirmations, 2);
    assert.equal(result.requiredConfirmations, 5);

    // Crucially, a pending hash is NOT claimed — it is a real deposit that just
    // needs more blocks, so it must stay submittable (§11).
    assert.equal(await consumedTxHashRepository.isConsumed(`BSC:${h.slice(2)}`), false);
  } finally {
    restore();
  }
});

test("a pending TX verifies once it has enough confirmations", async () => {
  const h = hash(0);
  const restore = withChain({ [h]: goodTokenTx(99) }, 110); // now 12 confirmations

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.VERIFIED, "the earlier pending attempt did not burn it");
    assert.equal(result.transaction.confirmations, 12);
  } finally {
    restore();
  }
});

test("an unmined transaction is pending, not not-found", async () => {
  const h = hash(4).replace(/4$/, "a");
  const restore = withChain({
    [h]: { tx: { from: SENDER, to: USDT, value: "0x0", blockNumber: null }, receipt: null },
  });

  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });
    assert.equal(result.status, TX_STATUS.PENDING_CONFIRMATIONS);
  } finally {
    restore();
  }
});

// ---- ownership + duplicates (spec §11, §12, §24) -----------

test("the same TX hash cannot be submitted twice", async () => {
  const h = hash(1); // claimed by peerA in the first test
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    const again = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(again.status, TX_STATUS.ALREADY_USED);
    assert.equal(again.claimedByYou, true);
  } finally {
    restore();
  }
});

test("a different peer gets Already Used and ownership never transfers", async () => {
  const h = hash(1);
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    const result = await verifyTxHash({ peerId: peerB.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.ALREADY_USED);
    assert.equal(result.claimedByYou, false);
    assert.equal(result.peerId, undefined, "the owning peer's identity is not disclosed");

    const entry = await consumedTxHashRepository.findByRegistryKey(`BSC:${h.slice(2)}`);
    assert.equal(entry.peerId, peerA.id, "still tied to the first peer (§26.10)");
  } finally {
    restore();
  }
});

test("case and 0x variants cannot claim the same hash twice", async () => {
  const h = hash(1);
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    for (const variant of [h.toUpperCase().replace("0X", "0x"), h.slice(2), h.slice(2).toUpperCase()]) {
      const result = await verifyTxHash({ peerId: peerB.id, methodId: "usdt_bep20", txHash: variant });
      assert.equal(result.status, TX_STATUS.ALREADY_USED, `variant slipped through: ${variant}`);
    }
  } finally {
    restore();
  }
});

test("two simultaneous requests for the same TX hash cannot both succeed", async () => {
  const h = hash(2).replace(/2$/, "f");
  const restore = withChain({ [h]: goodTokenTx() });

  try {
    // Spec §26.12 — the non-negotiable one.
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        verifyTxHash({
          peerId: i % 2 === 0 ? peerA.id : peerB.id,
          methodId: "usdt_bep20",
          txHash: h,
        })
      )
    );

    const verified = results.filter((r) => r.status === TX_STATUS.VERIFIED);
    const used = results.filter((r) => r.status === TX_STATUS.ALREADY_USED);

    assert.equal(verified.length, 1, "exactly one concurrent request may verify");
    assert.equal(used.length, 9, "the rest are told it is already used");

    const entries = await consumedTxHashRepository.find((c) => c.registryKey === `BSC:${h.slice(2)}`);
    assert.equal(entries.length, 1, "one registry entry, no duplicates");

    const txs = await listTransactions({ status: TX_STATUS.VERIFIED });
    assert.equal(
      txs.filter((t) => t.txHash === h).length,
      1,
      "and exactly one verified transaction record"
    );
  } finally {
    restore();
  }
});

test("a rejected hash is not claimed and stays submittable", async () => {
  const h = hash(5); // rejected earlier as WRONG_RECIPIENT

  assert.equal(
    await consumedTxHashRepository.isConsumed(`BSC:${h.slice(2)}`),
    false,
    "spec §11: an invalid TX hash must not be claimed by a peer"
  );

  // If the admin later configures that address, the same hash must work.
  const restore = withChain({
    [h]: {
      tx: { from: SENDER, to: USDT, value: "0x0", blockNumber: toHex(95) },
      receipt: {
        status: "0x1",
        blockNumber: toHex(95),
        logs: [transferLog({ contract: USDT, from: SENDER, to: OUTSIDE_ADDRESS, amount: HUNDRED })],
      },
    },
  });

  try {
    await deposits.addAddresses("usdt_bep20", OUTSIDE_ADDRESS);
    const result = await verifyTxHash({ peerId: peerB.id, methodId: "usdt_bep20", txHash: h });

    assert.equal(result.status, TX_STATUS.VERIFIED, "the earlier rejection did not burn the hash");
  } finally {
    restore();
  }
});

// ---- outages (spec §17, Phase 8) ---------------------------

test("a blockchain outage is an error, not a rejection, and never claims", async () => {
  const h = hash(3).replace(/3$/, "b");
  const restore = installDeadChain();

  try {
    const err = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h }).catch((e) => e);

    assert.equal(err.code, REASONS.BLOCKCHAIN_API_UNAVAILABLE);
    assert.equal(err.status, 503, "retryable, not a client error");
    assert.equal(
      await consumedTxHashRepository.isConsumed(`BSC:${h.slice(2)}`),
      false,
      "an outage must never burn a hash"
    );
  } finally {
    restore();
  }

  // Once the node is back, the same hash verifies normally.
  const restore2 = withChain({ [h]: goodTokenTx() });
  try {
    const result = await verifyTxHash({ peerId: peerA.id, methodId: "usdt_bep20", txHash: h });
    assert.equal(result.status, TX_STATUS.VERIFIED);
  } finally {
    restore2();
  }
});

test("a disabled method cannot be verified against", async () => {
  await deposits.setMethodStatus("bnb_native", "inactive");

  await assert.rejects(
    verifyTxHash({ peerId: peerA.id, methodId: "bnb_native", txHash: hash(7) }),
    /not available/
  );

  await deposits.setMethodStatus("bnb_native", "active");
});

// ---- admin monitoring (spec §20) ---------------------------

test("the admin can search transactions by hash, peer and status", async () => {
  const byHash = await listTransactions({ txHash: hash(1) });
  assert.ok(byHash.length >= 1);
  assert.equal(byHash[0].txHash, hash(1));

  // Without the 0x prefix too.
  assert.ok((await listTransactions({ txHash: hash(1).slice(2) })).length >= 1);

  const byPeer = await listTransactions({ peerId: peerA.id });
  assert.ok(byPeer.every((t) => t.peerId === peerA.id));

  const rejected = await listTransactions({ status: TX_STATUS.REJECTED });
  assert.ok(rejected.length > 0, "rejected attempts are recorded for the admin (§20)");
  assert.ok(rejected.every((t) => t.reason), "each carries a failure reason (§17)");
});

test("rejected attempts are visible but never counted as verified", async () => {
  const all = await listTransactions();
  const verifiedHashes = all.filter((t) => t.status === TX_STATUS.VERIFIED).map((t) => t.txHash);

  assert.equal(
    new Set(verifiedHashes).size,
    verifiedHashes.length,
    "no hash may appear twice as verified"
  );
});
