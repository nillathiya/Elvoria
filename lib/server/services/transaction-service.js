// ============================================================
//  Transaction verification + claiming (spec §10, §11, §12).
//
//  This is the heart of the system. The order of operations below is the flow
//  in §12 and is not incidental — each step exists to close a specific hole.
// ============================================================

import { depositMethodRepository } from "../repositories/deposit-method-repository.js";
import { depositAddressRepository } from "../repositories/deposit-address-repository.js";
import { transactionRepository } from "../repositories/transaction-repository.js";
import { consumedTxHashRepository } from "../repositories/consumed-txhash-repository.js";
import { getVerifier } from "../verifiers/verifier-registry.js";
import { BlockchainUnavailableError } from "../verifiers/rpc-client.js";
import { withTxHashLock } from "./tx-lock-service.js";
import { normalizeTxHash } from "../utils/hash-normalizer.js";
import { TX_STATUS, REASONS, ValidationError, NotFoundError } from "../utils/errors.js";
import { nowIso } from "./file-storage-service.js";

// Records a rejected/failed attempt so the admin can see it (spec §20).
// Deliberately does NOT touch the consumed registry: a hash that failed today
// (unmined, not yet confirmed, RPC down) may be perfectly valid tomorrow, and
// burning it here would permanently destroy a real deposit (§11).
async function recordAttempt({ status, reason, peerId, method, normalized, data = {}, submittedAt }) {
  return transactionRepository.create({
    txHash: normalized.canonical,
    registryKey: normalized.registryKey,
    peerId,
    methodId: method.id,
    network: method.network,
    asset: method.symbol,
    tokenContract: data.tokenContract ?? null,
    sender: data.sender ?? null,
    recipient: data.recipient ?? null,
    amount: data.amount ?? null,
    amountRaw: data.amountRaw ?? null,
    blockNumber: data.blockNumber ?? null,
    confirmations: data.confirmations ?? null,
    status,
    reason: reason ?? null,
    note: data.note ?? null,
    submittedAt,
    verifiedAt: null,
  });
}

export async function verifyTxHash({ peerId, methodId, txHash }) {
  const submittedAt = nowIso();

  const method = await depositMethodRepository.findById(methodId);
  if (!method) throw new NotFoundError("Deposit method not found");
  if (method.status !== "active") throw new ValidationError("This deposit method is not available");

  // 1. Validate the format and normalize (spec §12.1). Case and 0x-prefix
  //    variants must collapse to one key, or the same transaction could be
  //    claimed twice by spelling it differently.
  const normalized = normalizeTxHash(txHash, method.network);

  // 2. Cheap pre-check outside the lock. This is an optimisation only — the
  //    authoritative check is the one inside the lock below.
  const existing = await consumedTxHashRepository.findByRegistryKey(normalized.registryKey);
  if (existing) return alreadyUsed(existing, peerId);

  // 3. Take the per-hash lock (spec §12.4).
  return withTxHashLock(normalized.registryKey, async () => {
    // 4. Re-check INSIDE the lock (spec §12.5). Without this re-read, two
    //    requests could both pass step 2, then both claim. This single line is
    //    what makes §26.12 true.
    const claimed = await consumedTxHashRepository.findByRegistryKey(normalized.registryKey);
    if (claimed) return alreadyUsed(claimed, peerId);

    // 5. Only the admin's active addresses for THIS method are acceptable
    //    recipients (spec §15).
    const addresses = (await depositAddressRepository.listActiveByMethod(methodId)).map(
      (a) => a.address
    );
    if (!addresses.length) {
      throw new ValidationError("No receiving address is configured for this method");
    }

    // 6. Verify against the chain (spec §13). The verifier receives the method
    //    config and our addresses — never anything the peer submitted beyond
    //    the hash itself.
    const verifier = getVerifier(method.verifier);

    let result;
    try {
      result = await verifier.verify({ method, txHash: normalized.canonical, addresses });
    } catch (err) {
      if (err instanceof BlockchainUnavailableError) {
        // An outage is NOT a rejection. Record it for the admin, leave the
        // hash unclaimed, and let the peer retry (§17).
        await recordAttempt({
          status: TX_STATUS.FAILED,
          reason: REASONS.BLOCKCHAIN_API_UNAVAILABLE,
          peerId,
          method,
          normalized,
          submittedAt,
        });
        throw err;
      }
      throw err;
    }

    // 7a. Not confirmed enough yet: real, but not claimable. Recording it as
    //     pending lets the peer resubmit later and succeed (§17).
    if (result.status === TX_STATUS.PENDING_CONFIRMATIONS) {
      const tx = await recordAttempt({
        status: TX_STATUS.PENDING_CONFIRMATIONS,
        reason: REASONS.INSUFFICIENT_CONFIRMATIONS,
        peerId,
        method,
        normalized,
        data: result.data,
        submittedAt,
      });
      return {
        status: TX_STATUS.PENDING_CONFIRMATIONS,
        reason: REASONS.INSUFFICIENT_CONFIRMATIONS,
        transaction: toPublicTransaction(tx),
        confirmations: result.data.confirmations,
        requiredConfirmations: method.requiredConfirmations,
      };
    }

    // 7b. Rejected: the chain says this is not a valid deposit to us. The hash
    //     stays unclaimed (§11 — "an invalid TX hash must not be claimed").
    if (result.status !== TX_STATUS.VERIFIED) {
      const tx = await recordAttempt({
        status: TX_STATUS.REJECTED,
        reason: result.reason,
        peerId,
        method,
        normalized,
        data: result.data,
        submittedAt,
      });
      return { status: TX_STATUS.REJECTED, reason: result.reason, transaction: toPublicTransaction(tx) };
    }

    // 8. Verified — claim it (spec §12.7). Every stored value below came from
    //    the verifier reading the chain, not from the request.
    const verifiedAt = nowIso();
    const transaction = await transactionRepository.create({
      txHash: normalized.canonical,
      registryKey: normalized.registryKey,
      peerId,
      methodId: method.id,
      network: result.data.network,
      asset: result.data.asset,
      tokenContract: result.data.tokenContract,
      sender: result.data.sender,
      recipient: result.data.recipient,
      amount: result.data.amount,
      amountRaw: result.data.amountRaw,
      blockNumber: result.data.blockNumber,
      confirmations: result.data.confirmations,
      status: TX_STATUS.VERIFIED,
      reason: null,
      submittedAt,
      verifiedAt,
    });

    try {
      await consumedTxHashRepository.create({
        registryKey: normalized.registryKey,
        txHash: normalized.canonical,
        peerId,
        methodId: method.id,
        transactionId: transaction.id,
        consumedAt: verifiedAt,
      });
    } catch (err) {
      // Two files, one logical claim. If the registry write fails the
      // transaction record must not survive as a verified-but-unclaimed row —
      // a later submission would then create a second verified record for the
      // same hash.
      await transactionRepository.remove(transaction.id);
      throw err;
    }

    return {
      status: TX_STATUS.VERIFIED,
      transaction: toPublicTransaction(transaction),
    };
  });
}

function alreadyUsed(entry, peerId) {
  return {
    status: TX_STATUS.ALREADY_USED,
    reason: REASONS.TX_ALREADY_USED,
    // Whether it was this peer or another is the peer's own business to know;
    // the identity of the other peer is not disclosed.
    claimedByYou: entry.peerId === peerId,
  };
}

// ---- admin monitoring (spec §20) ---------------------------

export async function listTransactions(filters = {}) {
  const rows = await transactionRepository.all();

  const txHash = filters.txHash ? String(filters.txHash).trim().toLowerCase() : null;
  const search = filters.search ? String(filters.search).trim().toLowerCase() : null;

  const filtered = rows.filter((t) => {
    if (filters.peerId && t.peerId !== filters.peerId) return false;
    if (filters.methodId && t.methodId !== filters.methodId) return false;
    if (filters.network && t.network !== String(filters.network).toUpperCase()) return false;
    if (filters.status && t.status !== filters.status) return false;

    // Match with or without the 0x prefix, so pasting either form works.
    if (txHash) {
      const stored = String(t.txHash).toLowerCase();
      if (stored !== txHash && stored !== `0x${txHash}` && `0x${stored}` !== txHash) return false;
    }

    if (search) {
      const haystack = [t.txHash, t.sender, t.recipient, t.peerId, t.methodId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  // Newest first — an admin monitoring deposits cares about what just landed.
  return filtered.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
}

export async function getTransaction(id) {
  const tx = await transactionRepository.findById(id);
  if (!tx) throw new NotFoundError("Transaction not found");
  return tx;
}

// registryKey is an internal storage key; the admin sees txHash instead.
function toPublicTransaction(tx) {
  if (!tx) return null;
  const { registryKey, ...rest } = tx;
  return rest;
}
