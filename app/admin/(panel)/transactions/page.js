"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Receipt } from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import { statusVariant } from "@/lib/config";
import styles from "../peers/page.module.css";

// Spec §20: every field here was read from the blockchain by the verifier, not
// submitted by the peer.
const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "verified", label: "Verified" },
  { value: "pending_confirmations", label: "Pending confirmations" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
];

export default function AdminTransactionsPage() {
  const { showToast } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", status: "", peer: "" });

  const load = useCallback(
    (f) => {
      setLoading(true);

      // Empty filters are dropped rather than sent blank, so the server sees
      // "no filter" instead of "match the empty string".
      const params = new URLSearchParams(
        Object.entries(f).filter(([, v]) => v.trim?.() || v)
      );

      api
        .get(`/api/admin/transactions?${params}`)
        .then((d) => setTransactions(d.transactions))
        .catch((err) => showToast(err.message, "error"))
        .finally(() => setLoading(false));
    },
    [showToast]
  );

  useEffect(() => {
    load(filters);
    // Only on mount — searching is explicit, via the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const search = (e) => {
    e.preventDefault();
    load(filters);
  };

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.sub}>
          Every TX hash submitted by a peer, verified directly against the blockchain.
        </p>
      </header>

      <Card className={styles.formCard} style={{ marginBottom: 20 }}>
        <form onSubmit={search} className={styles.filters}>
          <Input
            placeholder="TX hash, address or peer"
            icon={Search}
            value={filters.q}
            onChange={set("q")}
          />
          <Input
            type="select"
            value={filters.status}
            options={STATUSES}
            onChange={set("status")}
          />
          <Input placeholder="Peer ID or name" value={filters.peer} onChange={set("peer")} />
          <Button type="submit" icon={Search}>Search</Button>
        </form>
      </Card>

      <Card padding="sm">
        <h2 className={styles.sectionTitle}>
          <Receipt size={18} /> Results <Badge variant="neutral" size="sm">{transactions.length}</Badge>
        </h2>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : !transactions.length ? (
          <p className={styles.empty}>No transactions match.</p>
        ) : (
          <div className={styles.list}>
            {transactions.map((t) => (
              <div key={t.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.rowName}>{t.txHash}</span>
                  <span className={styles.rowSub}>
                    {t.peerCode ?? t.peerId} · {t.network} · {t.methodId}
                    {t.blockNumber ? ` · block ${t.blockNumber}` : ""}
                    {t.confirmations != null ? ` · ${t.confirmations} conf` : ""}
                  </span>
                  <span className={styles.rowSub}>
                    {/* amount is the verifier's string — never re-parsed as a
                        float here (spec §18). */}
                    {t.amount ? `${t.amount} ${t.asset}` : "—"}
                    {t.sender ? ` · from ${t.sender}` : ""}
                    {t.recipient ? ` · to ${t.recipient}` : ""}
                  </span>
                  {t.reason && <span className={styles.rowSub}>Reason: {t.reason}</span>}
                </div>
                <Badge variant={statusVariant(t.status)} size="sm">{t.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
