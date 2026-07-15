"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, KeyRound, Users } from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import styles from "./page.module.css";

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
                      icon={KeyRound}
                      onClick={() => {
                        setResetting(resetting === p.id ? null : p.id);
                        setNewPin("");
                      }}
                    >
                      Reset PIN
                    </Button>
                  </div>

                  {resetting === p.id && (
                    <div className={styles.resetRow}>
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
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
