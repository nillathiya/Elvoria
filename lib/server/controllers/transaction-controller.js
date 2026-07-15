// ============================================================
//  Admin transaction monitoring controller (spec §20, §22).
// ============================================================

import { json } from "../middleware/api-handler.js";
import { requireAdmin } from "../middleware/auth.js";
import { listTransactions, getTransaction } from "../services/transaction-service.js";
import { peerRepository } from "../repositories/peer-repository.js";

// Transactions store a peerId; the admin searches by peer name or code, so
// resolve those here rather than denormalizing a name that could go stale.
async function withPeerNames(transactions) {
  const peers = await peerRepository.all();
  const byId = new Map(peers.map((p) => [p.id, p]));

  return transactions.map((t) => ({
    ...t,
    peerCode: byId.get(t.peerId)?.peerCode ?? null,
    peerName: byId.get(t.peerId)?.name ?? null,
  }));
}

export async function listTransactionsController(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);

  let peerId = searchParams.get("peerId") || undefined;

  // Spec §20: search by peer name or peer code, not just id.
  const peerQuery = searchParams.get("peer");
  if (peerQuery && !peerId) {
    const needle = peerQuery.trim().toLowerCase();
    const match = (await peerRepository.all()).find(
      (p) =>
        String(p.peerCode).toLowerCase() === needle ||
        String(p.name).toLowerCase().includes(needle)
    );
    // No such peer must return nothing, not everything — an unmatched filter
    // that falls through to "no filter" is a silent lie.
    peerId = match?.id ?? "__no_such_peer__";
  }

  const transactions = await listTransactions({
    peerId,
    methodId: searchParams.get("methodId") || undefined,
    network: searchParams.get("network") || undefined,
    status: searchParams.get("status") || undefined,
    txHash: searchParams.get("txHash") || undefined,
    search: searchParams.get("q") || undefined,
  });

  return json({ transactions: await withPeerNames(transactions) });
}

export async function getTransactionController(_request, { params }) {
  await requireAdmin();

  const [transaction] = await withPeerNames([await getTransaction(params.id)]);
  return json({ transaction });
}
