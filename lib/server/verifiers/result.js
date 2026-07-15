// ============================================================
//  The shape every verifier returns.
//
//  A verifier's job is to answer from chain data alone. It is handed the
//  method config and the admin's configured addresses, and nothing that the
//  peer or the frontend submitted beyond the TX hash itself (spec §26.14).
// ============================================================

import { TX_STATUS } from "../utils/errors.js";

// data carries what was INDEPENDENTLY read from the chain (spec §14):
//   sender, recipient, amount, amountRaw, blockNumber, confirmations,
//   tokenContract, network, asset
export function verified(data) {
  return { status: TX_STATUS.VERIFIED, data };
}

// Not a rejection: the transaction looks right but is not buried deep enough
// yet, so the peer can retry once it is (spec §17).
export function pendingConfirmations(data) {
  return { status: TX_STATUS.PENDING_CONFIRMATIONS, reason: "INSUFFICIENT_CONFIRMATIONS", data };
}

export function rejected(reason, data = {}) {
  return { status: TX_STATUS.REJECTED, reason, data };
}
