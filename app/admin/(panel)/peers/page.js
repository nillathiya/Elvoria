"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, KeyRound, Users, Pencil, Receipt } from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import { statusVariant } from "@/lib/config";
import styles from "./page.module.css";

const fmtWhen = (iso) => {
  if (!iso) return "never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "never" : d.toLocaleString();
};

// Spec §6: peers are created only here, by an admin. There is no
// self-registration path (§26.7), and the PIN is write-only — once set, no
// screen or API can show it again.
export default function AdminPeersPage() {
  const { showToast } = useApp();
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ peerCode: "", name: "", pin: "" });
  const [resetting, setResetting] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [txPeer, setTxPeer] = useState(null);
  const [txs, setTxs] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  const load = useCallback(() => {
    api
      .get("/api/admin/peers")
      .then((d) => setPeers(d.peers))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(load, [load]);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/admin/peers", form);
      showToast(`Peer ${form.peerCode.toUpperCase()} created`);
      // Clearing the PIN immediately keeps it off the screen — the admin is
      // not meant to see it again after creation.
      setForm({ peerCode: "", name: "", pin: "" });
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (peer) => {
    const status = peer.status === "active" ? "disabled" : "active";
    try {
      await api.patch(`/api/admin/peers/${peer.id}/status`, { status });
      showToast(`${peer.peerCode} ${status}`);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Spec §2.1 "view TX hashes submitted by each peer" / §6 "view all
  // transactions tied to that peer". The Transactions page can filter by peer,
  // but that is a search — this answers the question these sections actually
  // ask, from the peer's own row.
  const toggleTransactions = async (peer) => {
    if (txPeer === peer.id) {
      setTxPeer(null);
      return;
    }

    setTxPeer(peer.id);
    setTxs([]);
    setTxLoading(true);
    try {
      const { transactions } = await api.get(`/api/admin/peers/${peer.id}/transactions`);
      setTxs(transactions);
    } catch (err) {
      showToast(err.message, "error");
      setTxPeer(null);
    } finally {
      setTxLoading(false);
    }
  };

  // Spec §6 allows editing the name only. peerCode is the login identifier and
  // is what existing transactions are read back through, so the API does not
  // accept a change to it and this form does not offer one.
  const saveName = async (peer) => {
    const name = editName.trim();
    if (!name) return showToast("Peer name cannot be empty", "error");
    try {
      await api.put(`/api/admin/peers/${peer.id}`, { name });
      showToast(`${peer.peerCode} renamed`);
      setEditing(null);
      setEditName("");
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const resetPin = async (peer) => {
    if (!/^[0-9]{6}$/.test(newPin)) return showToast("PIN must be exactly 6 digits", "error");
    try {
      await api.post(`/api/admin/peers/${peer.id}/reset-pin`, { pin: newPin });
      showToast(`PIN reset for ${peer.peerCode}`);
      setResetting(null);
      setNewPin("");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>Peers</h1>
        <p className={styles.sub}>
          Create and manage peer accounts. Peers can only submit a TX hash for verification —
          nothing else.
        </p>
      </header>

      <div className={styles.layout}>
        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>
            <UserPlus size={18} /> Create peer
          </h2>
          <form onSubmit={create}>
            <Input
              label="Peer ID"
              value={form.peerCode}
              placeholder="PEER001"
              helper="Used to log in. Letters, numbers, _ and - only."
              onChange={(e) =>
                setForm((f) => ({ ...f, peerCode: e.target.value.toUpperCase().slice(0, 32) }))
              }
            />
            <Input
              label="Peer name"
              value={form.name}
              placeholder="Peer One"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              type="password"
              label="6-digit PIN"
              value={form.pin}
              inputMode="numeric"
              maxLength={6}
              helper="You will not be able to see this PIN again."
              onChange={(e) =>
                setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))
              }
            />
            <Button type="submit" size="lg" fullWidth icon={UserPlus} loading={saving}>
              Create peer
            </Button>
          </form>
        </Card>

        <Card padding="sm" className={styles.listCard}>
          <h2 className={styles.sectionTitle}>
            <Users size={18} /> All peers <Badge variant="neutral" size="sm">{peers.length}</Badge>
          </h2>

          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : !peers.length ? (
            <p className={styles.empty}>No peers yet. Create one to get started.</p>
          ) : (
            <div className={styles.list}>
              {peers.map((p) => (
                <div key={p.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowName}>{p.peerCode}</span>
                    <span className={styles.rowSub}>{p.name}</span>
                    {/* Spec §2.1 "view peer activity" — when they last signed
                        in, alongside what they submitted. */}
                    <span className={styles.rowSub}>Last sign-in: {fmtWhen(p.lastLoginAt)}</span>
                  </div>
                  <Badge variant={p.status === "active" ? "success" : "neutral"} size="sm">
                    {p.status}
                  </Badge>
                  <div className={styles.rowActions}>
                    <Button variant="outline" size="sm" onClick={() => toggle(p)}>
                      {p.status === "active" ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Pencil}
                      onClick={() => {
                        // Only one inline form at a time, so it is always clear
                        // which field the Save button belongs to.
                        setResetting(null);
                        setEditing(editing === p.id ? null : p.id);
                        setEditName(p.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={KeyRound}
                      onClick={() => {
                        setEditing(null);
                        setResetting(resetting === p.id ? null : p.id);
                        setNewPin("");
                      }}
                    >
                      Reset PIN
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Receipt}
                      onClick={() => toggleTransactions(p)}
                    >
                      {txPeer === p.id ? "Hide" : "Transactions"}
                    </Button>
                  </div>

                  {editing === p.id && (
                    <div className={styles.inlineForm}>
                      <Input
                        label="Peer name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Button size="sm" onClick={() => saveName(p)}>Save</Button>
                    </div>
                  )}

                  {resetting === p.id && (
                    <div className={styles.inlineForm}>
                      <Input
                        type="password"
                        value={newPin}
                        placeholder="New 6-digit PIN"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                      <Button size="sm" onClick={() => resetPin(p)}>Save</Button>
                    </div>
                  )}

                  {txPeer === p.id && (
                    <div className={styles.txPanel}>
                      {txLoading ? (
                        <p className={styles.empty}>Loading…</p>
                      ) : !txs.length ? (
                        <p className={styles.empty}>
                          {p.peerCode} has not submitted any TX hashes yet.
                        </p>
                      ) : (
                        txs.map((t) => (
                          <div key={t.id} className={styles.txRow}>
                            <span className={styles.txHash}>{t.txHash}</span>
                            <span className={styles.rowSub}>
                              {/* The amount is the verifier's string — never
                                  re-parsed as a float here (§18). */}
                              {t.amount ? `${t.amount} ${t.asset}` : "—"} · {t.network}
                              {t.reason ? ` · ${t.reason}` : ""}
                            </span>
                            <Badge variant={statusVariant(t.status)} size="sm">
                              {t.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
