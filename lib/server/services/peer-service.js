// ============================================================
//  Peer service (spec §6) — admin-only peer management.
//
//  Peers are created ONLY here, by an admin (spec §26.7). There is
//  deliberately no self-registration path anywhere in the codebase.
// ============================================================

import { peerRepository } from "../repositories/peer-repository.js";
import { transactionRepository } from "../repositories/transaction-repository.js";
import { hashSecret } from "../utils/crypto-hash.js";
import { assertPin, assertPeerCode, assertNonEmpty, assertOneOf } from "../utils/validation.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { toPublicPeer } from "./auth-service.js";

const STATUSES = ["active", "disabled"];

export async function listPeers() {
  const peers = await peerRepository.all();
  return peers.map(toPublicPeer);
}

export async function getPeer(id) {
  const peer = await peerRepository.findById(id);
  if (!peer) throw new NotFoundError("Peer not found");
  return toPublicPeer(peer);
}

export async function createPeer({ peerCode, name, pin, status = "active" }) {
  const code = assertPeerCode(peerCode);
  const peerName = assertNonEmpty(name, "Peer name");
  assertOneOf(status, STATUSES, "Status");
  assertPin(pin, "Peer PIN");

  const pinHash = await hashSecret(pin);

  try {
    const peer = await peerRepository.create({ peerCode: code, name: peerName, pinHash, status });
    // Spec §6: the admin never sees the PIN again after creation — it is not
    // echoed back here, and no read path returns it.
    return toPublicPeer(peer);
  } catch (err) {
    if (err.code === "DUPLICATE") throw new ConflictError(`Peer ID ${code} already exists`);
    throw err;
  }
}

// Spec §6 lists only "edit peer name" — peerCode is the login identifier and
// is tied to existing transactions, so it is intentionally immutable.
export async function updatePeer(id, { name }) {
  const peerName = assertNonEmpty(name, "Peer name");

  const updated = await peerRepository.update(id, { name: peerName });
  if (!updated) throw new NotFoundError("Peer not found");
  return toPublicPeer(updated);
}

export async function setPeerStatus(id, status) {
  assertOneOf(status, STATUSES, "Status");

  const updated = await peerRepository.update(id, { status });
  if (!updated) throw new NotFoundError("Peer not found");
  return toPublicPeer(updated);
}

export async function resetPeerPin(id, pin) {
  assertPin(pin, "Peer PIN");

  const pinHash = await hashSecret(pin);
  const updated = await peerRepository.update(id, { pinHash });
  if (!updated) throw new NotFoundError("Peer not found");

  // Existing peer sessions intentionally survive a PIN reset. Disable the peer
  // if the intent is to cut off access right now — that is checked per request.
  return toPublicPeer(updated);
}

// Spec §6: "view all transactions tied to that peer".
export async function getPeerTransactions(id) {
  const peer = await peerRepository.findById(id);
  if (!peer) throw new NotFoundError("Peer not found");
  return transactionRepository.listByPeer(id);
}
