// ============================================================
//  Storage config — file-based only. No database.
//  Every path the backend is allowed to touch is declared here.
// ============================================================

import path from "path";

// STORAGE_DIR lets deployments point at a writable volume; the repo-local
// default is what runs in dev.
export const STORAGE_ROOT =
  process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

export const COLLECTIONS = {
  admin: "admin.json",
  peers: "peers.json",
  users: "users.json",
  depositMethods: "deposit-methods.json",
  depositAddresses: "deposit-addresses.json",
  depositRequests: "deposit-requests.json",
  transactions: "transactions.json",
  consumedTxHashes: "consumed-txhashes.json",
  loginAttempts: "login-attempts.json",
};

export const DIRS = {
  sessions: path.join(STORAGE_ROOT, "sessions"),
  locks: path.join(STORAGE_ROOT, "locks"),
  logs: path.join(STORAGE_ROOT, "logs"),
};

export function collectionPath(name) {
  const file = COLLECTIONS[name];
  if (!file) throw new Error(`Unknown collection: ${name}`);
  return path.join(STORAGE_ROOT, file);
}
