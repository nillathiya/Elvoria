// ============================================================
//  Development seed. Run: npm run seed-dev
//
//  Creates a known admin PIN, two peers and two deposit methods so the app can
//  be clicked through locally. This is a DEV TOOL, not application data — it
//  lives in scripts/ and nothing in src imports it.
//
//  It deliberately does NOT create receiving addresses. An address seeded here
//  would be one this script's author picked, not yours, and crypto sent to it
//  is unrecoverable. Add your own via Admin -> Deposit address.
// ============================================================

import { createInterface } from "readline";
import { stdin, stdout } from "process";

const ADMIN_PIN = "246810";
const PEERS = [
  { peerCode: "PEER001", name: "Peer One", pin: "654321", status: "active" },
  { peerCode: "PEER002", name: "Peer Two", pin: "112233", status: "disabled" },
];
const USER = { email: "demo@example.com", username: "demouser", password: "correct horse battery staple" };

// These PINs are published in this file, so anything seeded with them is
// public knowledge. Refusing outright is safer than trusting an env var to be
// set correctly on the one day it matters.
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV=production. These credentials are public.");
  process.exit(1);
}

const { ensureStorage } = await import("../lib/server/services/file-storage-service.js");
const { setAdminPin, isAdminProvisioned, userRegister } = await import(
  "../lib/server/services/auth-service.js"
);
const { createPeer, listPeers } = await import("../lib/server/services/peer-service.js");
const { createMethod, listMethods } = await import("../lib/server/services/deposit-service.js");
const { userRepository } = await import("../lib/server/repositories/user-repository.js");

function ask(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

await ensureStorage();

// Never overwrite something already set up — a seed that clobbers a real admin
// PIN or real peers is a footgun, not a convenience.
const existing = [];
if (await isAdminProvisioned()) existing.push("an admin PIN");
if ((await listPeers()).length) existing.push("peers");
if ((await listMethods()).length) existing.push("deposit methods");

if (existing.length) {
  console.log(`\nStorage already contains ${existing.join(", ")}.`);
  const answer = await ask("Seed anyway? Existing records are kept, new ones are added. (yes/no): ");
  if (answer !== "yes") {
    console.log("Cancelled. Nothing changed.");
    process.exit(0);
  }
}

if (!process.env.AUTH_PEPPER) {
  console.warn(
    "\n  Note: AUTH_PEPPER is not set, so these hashes are unpeppered.\n" +
      "  Set it before seeding anything you intend to keep — changing it later\n" +
      "  invalidates every PIN and password.\n"
  );
}

const created = [];

if (!(await isAdminProvisioned())) {
  await setAdminPin(ADMIN_PIN);
  created.push(`Admin           PIN ${ADMIN_PIN}`);
}

for (const peer of PEERS) {
  try {
    await createPeer(peer);
    created.push(`${peer.peerCode.padEnd(15)} PIN ${peer.pin}${peer.status === "disabled" ? "  (disabled — for testing the disabled path)" : ""}`);
  } catch (err) {
    console.log(`  skipped ${peer.peerCode}: ${err.message}`);
  }
}

// Methods carry the real mainnet contract for USDT on BSC. That is a public
// constant and is only ever compared against, never sent to.
const METHODS = [
  {
    id: "usdt_bep20",
    name: "USDT BEP20",
    network: "BSC",
    assetType: "token",
    symbol: "USDT",
    contractAddress: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    requiredConfirmations: 5,
    verifier: "bsc-token-verifier",
  },
  {
    id: "bnb_native",
    name: "BNB",
    network: "BSC",
    assetType: "native",
    symbol: "BNB",
    decimals: 18,
    requiredConfirmations: 5,
    verifier: "bsc-native-verifier",
  },
];

for (const method of METHODS) {
  try {
    await createMethod(method);
    created.push(`Method          ${method.id}`);
  } catch (err) {
    console.log(`  skipped ${method.id}: ${err.message}`);
  }
}

if (!(await userRepository.findByEmail(USER.email))) {
  await userRegister(USER);
  created.push(`User            ${USER.email} / ${USER.password}`);
}

console.log("\nSeeded:\n");
created.forEach((line) => console.log(`  ${line}`));

console.log(
  "\nNext: sign in at /admin with the PIN above and add YOUR OWN receiving\n" +
    "addresses under Deposit address. None are seeded on purpose — an address\n" +
    "from a script is not your wallet, and crypto sent to it cannot be recovered.\n"
);
