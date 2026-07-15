// ============================================================
//  Admin peer management controller (spec §22).
//  Every handler is admin-gated — peers cannot reach any of this.
// ============================================================

import { json, readJsonBody } from "../middleware/api-handler.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  listPeers,
  getPeer,
  createPeer,
  updatePeer,
  setPeerStatus,
  resetPeerPin,
  getPeerTransactions,
} from "../services/peer-service.js";

export async function listPeersController() {
  await requireAdmin();
  return json({ peers: await listPeers() });
}

export async function createPeerController(request) {
  await requireAdmin();
  const body = await readJsonBody(request);

  const peer = await createPeer({
    peerCode: body.peerCode,
    name: body.name,
    pin: body.pin,
    status: body.status,
  });

  return json({ ok: true, peer }, { status: 201 });
}

export async function getPeerController(_request, { params }) {
  await requireAdmin();
  return json({ peer: await getPeer(params.id) });
}

export async function updatePeerController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, peer: await updatePeer(params.id, { name: body.name }) });
}

export async function setPeerStatusController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, peer: await setPeerStatus(params.id, body.status) });
}

export async function resetPeerPinController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  await resetPeerPin(params.id, body.pin);

  // The new PIN is not echoed back: the admin already typed it, and returning
  // it would put a live credential into logs and browser history.
  return json({ ok: true });
}

export async function peerTransactionsController(_request, { params }) {
  await requireAdmin();
  return json({ transactions: await getPeerTransactions(params.id) });
}
