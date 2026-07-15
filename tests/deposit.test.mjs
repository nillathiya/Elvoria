// ============================================================
//  Phase 3-4 tests — peer management (§6) and deposits (§7, §8, §9).
//  Covers the spec §24 "Deposit Address Tests" list.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const TMP = await fs.mkdtemp(path.join(os.tmpdir(), "elvoria-deposit-test-"));
process.env.STORAGE_DIR = TMP;
process.env.AUTH_PEPPER = "test-pepper";

const { ensureStorage } = await import("../lib/server/services/file-storage-service.js");
const peers = await import("../lib/server/services/peer-service.js");
const deposits = await import("../lib/server/services/deposit-service.js");
const { depositAddressRepository } = await import(
  "../lib/server/repositories/deposit-address-repository.js"
);
const auth = await import("../lib/server/services/auth-service.js");

await ensureStorage();
test.after(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

const BEP20 = {
  id: "usdt_bep20",
  name: "USDT BEP20",
  network: "BSC",
  assetType: "token",
  symbol: "USDT",
  contractAddress: "0x55d398326f99059fF775485246999027B3197955",
  decimals: 18,
  requiredConfirmations: 5,
  verifier: "bsc-token-verifier",
  status: "active",
};

const A1 = "0x1111111111111111111111111111111111111111";
const A2 = "0x2222222222222222222222222222222222222222";
const A3 = "0x3333333333333333333333333333333333333333";

// ---- peer management (spec §6) -----------------------------

test("admin creates a peer and the PIN is never readable afterwards", async () => {
  const peer = await peers.createPeer({ peerCode: "PEER100", name: "Peer One", pin: "123456" });

  assert.equal(peer.peerCode, "PEER100");
  assert.equal(peer.pinHash, undefined, "spec §6: admin must not see the PIN after creation");

  const fetched = await peers.getPeer(peer.id);
  assert.equal(fetched.pinHash, undefined);

  const listed = await peers.listPeers();
  assert.ok(listed.every((p) => p.pinHash === undefined), "list must not leak hashes either");
});

test("peer creation enforces the 6-digit PIN rule", async () => {
  for (const pin of ["12345", "1234567", "abcdef", ""]) {
    await assert.rejects(
      peers.createPeer({ peerCode: `BAD${pin || "X"}`, name: "Bad", pin }),
      `expected reject for pin ${JSON.stringify(pin)}`
    );
  }
});

test("duplicate peer codes are rejected, case-insensitively", async () => {
  await peers.createPeer({ peerCode: "PEER101", name: "One", pin: "123456" });

  await assert.rejects(peers.createPeer({ peerCode: "PEER101", name: "Two", pin: "123456" }), /already exists/);
  await assert.rejects(peers.createPeer({ peerCode: "peer101", name: "Two", pin: "123456" }), /already exists/);
});

test("admin can rename, disable and re-enable a peer", async () => {
  const peer = await peers.createPeer({ peerCode: "PEER102", name: "Before", pin: "123456" });

  assert.equal((await peers.updatePeer(peer.id, { name: "After" })).name, "After");
  assert.equal((await peers.setPeerStatus(peer.id, "disabled")).status, "disabled");

  await assert.rejects(
    auth.peerLogin({ peerCode: "PEER102", pin: "123456", clientIp: "5.0.0.1" }),
    "a disabled peer must not log in"
  );

  await peers.setPeerStatus(peer.id, "active");
  const ok = await auth.peerLogin({ peerCode: "PEER102", pin: "123456", clientIp: "5.0.0.2" });
  assert.ok(ok.session.token, "re-enabling restores access");
});

test("resetting a peer PIN invalidates the old one", async () => {
  const peer = await peers.createPeer({ peerCode: "PEER103", name: "Reset Me", pin: "111111" });

  await peers.resetPeerPin(peer.id, "999999");

  await assert.rejects(auth.peerLogin({ peerCode: "PEER103", pin: "111111", clientIp: "5.0.0.3" }));
  const ok = await auth.peerLogin({ peerCode: "PEER103", pin: "999999", clientIp: "5.0.0.4" });
  assert.ok(ok.session.token);
});

// ---- deposit methods (spec §7) -----------------------------

test("a token method requires a contract address and decimals", async () => {
  await assert.rejects(
    deposits.createMethod({ ...BEP20, id: "no_contract", contractAddress: null }),
    /requires a token contract/
  );
  await assert.rejects(
    deposits.createMethod({ ...BEP20, id: "bad_decimals", decimals: "many" }),
    /decimals/
  );
});

test("a verifier must match the method's network and asset type", async () => {
  // Spec §26.17: an independent module per network — a TRON verifier must not
  // be attachable to a BSC method.
  await assert.rejects(
    deposits.createMethod({ ...BEP20, id: "wrong_verifier", verifier: "tron-token-verifier" }),
    /handles TRON\/token/
  );
  await assert.rejects(
    deposits.createMethod({ ...BEP20, id: "native_verifier", verifier: "bsc-native-verifier" }),
    /handles BSC\/native/
  );
  await assert.rejects(deposits.createMethod({ ...BEP20, id: "no_such", verifier: "magic-verifier" }), /Unknown verifier/);
});

test("a method's contract address is stored normalized", async () => {
  const method = await deposits.createMethod(BEP20);

  assert.equal(
    method.contractAddress,
    BEP20.contractAddress.toLowerCase(),
    "stored lowercase so §16's contract comparison is exact"
  );
});

test("a native method cannot carry a token contract", async () => {
  const method = await deposits.createMethod({
    id: "bnb_native",
    name: "BNB",
    network: "BSC",
    assetType: "native",
    symbol: "BNB",
    contractAddress: A1,
    requiredConfirmations: 5,
    verifier: "bsc-native-verifier",
  });

  assert.equal(method.contractAddress, null, "a native transfer has no contract to check");
});

test("the public method shape hides the internal verifier id", async () => {
  const [method] = await deposits.listActiveMethodsPublic();
  assert.equal(method.verifier, undefined);
  assert.equal(method.contractAddress, undefined);
});

// ---- addresses (spec §8, §24) ------------------------------

test("admin can add one address", async () => {
  const created = await deposits.addAddresses("usdt_bep20", A1);

  assert.equal(created.length, 1);
  assert.equal(created[0].address, A1);
  assert.equal(created[0].status, "active");
});

test("admin can add multiple addresses at once", async () => {
  const created = await deposits.addAddresses("usdt_bep20", [A2, A3]);

  assert.equal(created.length, 2);
  const all = await deposits.listAddresses("usdt_bep20");
  assert.equal(all.length, 3, "the batch joins the address already present");
});

test("an address is validated against the method's own network", async () => {
  await assert.rejects(
    deposits.addAddresses("usdt_bep20", "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"),
    "a TRON address must not be storable on a BSC method"
  );
  await assert.rejects(deposits.addAddresses("usdt_bep20", "not-an-address"));
});

test("a batch containing one bad address saves none of them", async () => {
  const before = (await deposits.listAddresses("usdt_bep20")).length;

  await assert.rejects(
    deposits.addAddresses("usdt_bep20", ["0x4444444444444444444444444444444444444444", "garbage"])
  );

  const after = (await deposits.listAddresses("usdt_bep20")).length;
  assert.equal(after, before, "the good address in the batch must not be half-saved");
});

test("the same address cannot be added twice to a method", async () => {
  await assert.rejects(deposits.addAddresses("usdt_bep20", A1), /already configured/);
  await assert.rejects(deposits.addAddresses("usdt_bep20", A1.toUpperCase()), /already configured/);
  await assert.rejects(deposits.addAddresses("usdt_bep20", [A2, A2]), /Duplicate address in request/);
});

// ---- random assignment (spec §9, §24) ----------------------

test("random selection only uses active addresses for the selected method", async () => {
  // Everything except A1 is off, and a second method's address must never leak
  // into this method's pool.
  const all = await deposits.listAddresses("usdt_bep20");
  for (const a of all) {
    await deposits.setAddressStatus(a.id, a.address === A1 ? "active" : "inactive");
  }
  await deposits.addAddresses("bnb_native", "0x9999999999999999999999999999999999999999");

  for (let i = 0; i < 20; i++) {
    const user = await auth.userRegister({
      email: `pick${i}@example.com`,
      username: `pick${i}`,
      password: "password123",
    });
    const deposit = await deposits.createDepositRequest({ userId: user.id, methodId: "usdt_bep20" });

    assert.equal(deposit.assignedAddress, A1, "a disabled address must never be selected");
  }
});

test("selection spreads across all active addresses", async () => {
  const all = await deposits.listAddresses("usdt_bep20");
  for (const a of all) await deposits.setAddressStatus(a.id, "active");

  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const user = await auth.userRegister({
      email: `spread${i}@example.com`,
      username: `spread${i}`,
      password: "password123",
    });
    const deposit = await deposits.createDepositRequest({ userId: user.id, methodId: "usdt_bep20" });
    seen.add(deposit.assignedAddress);
  }

  // 60 draws from 4 active addresses hitting only one would mean the RNG or the
  // filter is broken. Chance of a false failure here is ~4 * (3/4)^60 ≈ 1e-7.
  assert.ok(seen.size > 1, `expected several addresses, saw ${[...seen].join(", ")}`);
});

test("an assigned address stays tied to the deposit request across refreshes", async () => {
  const user = await auth.userRegister({
    email: "sticky@example.com",
    username: "sticky",
    password: "password123",
  });

  const first = await deposits.createDepositRequest({ userId: user.id, methodId: "usdt_bep20" });

  // Spec §9: "do not randomly select a new address every time the page
  // refreshes for the same active deposit request".
  for (let i = 0; i < 10; i++) {
    const again = await deposits.createDepositRequest({ userId: user.id, methodId: "usdt_bep20" });
    assert.equal(again.id, first.id, "the open request is reused, not duplicated");
    assert.equal(again.assignedAddress, first.assignedAddress, "the address must not change");
  }

  const fetched = await deposits.getDepositRequest(first.id, user.id);
  assert.equal(fetched.assignedAddress, first.assignedAddress);
});

test("an assigned address survives being disabled afterwards", async () => {
  const user = await auth.userRegister({
    email: "kept@example.com",
    username: "kept",
    password: "password123",
  });

  const deposit = await deposits.createDepositRequest({ userId: user.id, methodId: "usdt_bep20" });
  const assigned = await depositAddressRepository.findOne((a) => a.address === deposit.assignedAddress);
  await deposits.setAddressStatus(assigned.id, "inactive");

  const fetched = await deposits.getDepositRequest(deposit.id, user.id);
  assert.equal(
    fetched.assignedAddress,
    deposit.assignedAddress,
    "the user was already told this address — the record must still show it"
  );
});

test("a user cannot read another user's deposit request", async () => {
  const owner = await auth.userRegister({ email: "own@example.com", username: "own", password: "password123" });
  const other = await auth.userRegister({ email: "oth@example.com", username: "oth", password: "password123" });

  const deposit = await deposits.createDepositRequest({ userId: owner.id, methodId: "usdt_bep20" });

  await assert.rejects(deposits.getDepositRequest(deposit.id, other.id), /not found/);
});

test("a deposit cannot be created against an inactive method", async () => {
  await deposits.setMethodStatus("bnb_native", "inactive");
  const user = await auth.userRegister({ email: "off@example.com", username: "off", password: "password123" });

  await assert.rejects(
    deposits.createDepositRequest({ userId: user.id, methodId: "bnb_native" }),
    /not available/
  );
  await deposits.setMethodStatus("bnb_native", "active");
});

test("a method with no active address fails loudly rather than assigning nothing", async () => {
  await deposits.createMethod({
    id: "empty_method",
    name: "Empty",
    network: "BSC",
    assetType: "native",
    symbol: "BNB",
    requiredConfirmations: 1,
    verifier: "bsc-native-verifier",
  });

  const user = await auth.userRegister({ email: "e@example.com", username: "emptyu", password: "password123" });
  const err = await deposits
    .createDepositRequest({ userId: user.id, methodId: "empty_method" })
    .catch((e) => e);

  assert.equal(err.code, "NO_ACTIVE_ADDRESS");
});

// ---- delete safety (spec §8) -------------------------------

test("an address in use by a deposit request cannot be deleted or rewritten", async () => {
  const user = await auth.userRegister({ email: "used@example.com", username: "used", password: "password123" });
  const deposit = await deposits.createDepositRequest({ userId: user.id, methodId: "usdt_bep20" });
  const assigned = await depositAddressRepository.findOne((a) => a.address === deposit.assignedAddress);

  const err = await deposits.deleteAddress(assigned.id).catch((e) => e);
  assert.equal(err.code, "ADDRESS_IN_USE", "deleting it would orphan a live request");

  await assert.rejects(
    deposits.updateAddress(assigned.id, { address: "0x5555555555555555555555555555555555555555" }),
    /cannot be changed/
  );

  // Disabling is always allowed — that is the safe way to retire an address.
  assert.equal((await deposits.setAddressStatus(assigned.id, "inactive")).status, "inactive");
});

test("an unused address can be deleted", async () => {
  const [created] = await deposits.addAddresses(
    "usdt_bep20",
    "0x6666666666666666666666666666666666666666"
  );

  assert.deepEqual(await deposits.deleteAddress(created.id), { ok: true });
  assert.equal(await depositAddressRepository.findById(created.id), null);
});

test("a method's network cannot change once it has addresses", async () => {
  // The verifier has to move with the network, or the verifier/network match
  // check rejects it first and this guard never runs.
  await assert.rejects(
    deposits.updateMethod("usdt_bep20", { network: "ETH", verifier: "eth-token-verifier" }),
    /Cannot change the network/
  );

  // The stored addresses are BSC-format and must be untouched by the attempt.
  const method = await deposits.listMethods();
  assert.equal(method.find((m) => m.id === "usdt_bep20").network, "BSC");
});

test("a method with no addresses may still change network", async () => {
  await deposits.createMethod({
    id: "movable",
    name: "Movable",
    network: "BSC",
    assetType: "native",
    symbol: "BNB",
    requiredConfirmations: 1,
    verifier: "bsc-native-verifier",
  });

  const moved = await deposits.updateMethod("movable", {
    network: "ETH",
    symbol: "ETH",
    verifier: "eth-native-verifier",
  });
  assert.equal(moved.network, "ETH");
});
