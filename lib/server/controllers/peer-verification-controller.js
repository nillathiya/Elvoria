// ============================================================
//  Peer TX verification controller (spec §10, §22).
//  This is the peer panel's only function (spec §26.9).
// ============================================================

import { json, readJsonBody } from "../middleware/api-handler.js";
import { requirePeer } from "../middleware/auth.js";
import { listActiveMethodsPublic } from "../services/deposit-service.js";
import { verifyTxHash } from "../services/transaction-service.js";

export async function peerMethodsController() {
  await requirePeer();
  return json({ methods: await listActiveMethodsPublic() });
}

export async function peerVerifyTxController(request) {
  // requirePeer re-reads the peer, so a peer disabled mid-session cannot claim.
  const { peer } = await requirePeer();
  const body = await readJsonBody(request);

  // Only methodId and txHash are read. Amount, sender, recipient, token,
  // contract, status and confirmations are NEVER taken from the request — they
  // are fetched from the chain (spec §26.14). Any such fields in the body are
  // ignored rather than trusted.
  const result = await verifyTxHash({
    peerId: peer.id,
    methodId: body.methodId,
    txHash: body.txHash,
  });

  return json(result);
}
