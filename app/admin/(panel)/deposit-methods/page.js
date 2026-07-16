"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Pencil, X, Save } from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import styles from "../peers/page.module.css";

// Spec §7. The verifier list mirrors the server's registry — the API rejects
// any combination this form could get wrong, so the form is a convenience, not
// the validation.
const NETWORKS = ["BSC", "ETH", "TRON", "BTC"];
const VERIFIERS = [
  "bsc-native-verifier",
  "bsc-token-verifier",
  "eth-native-verifier",
  "eth-token-verifier",
  "tron-native-verifier",
  "tron-token-verifier",
  "btc-verifier",
];

const EMPTY = {
  id: "",
  name: "",
  displayName: "",
  network: "BSC",
  assetType: "token",
  symbol: "",
  contractAddress: "",
  decimals: "18",
  requiredConfirmations: "5",
  minAmount: "",
  verifier: "bsc-token-verifier",
};

// Editing reuses this same form, so a stored method has to come back as form
// state: every field is a string here, and absent optionals are "" not null.
const toForm = (m) => ({
  id: m.id,
  name: m.name ?? "",
  displayName: m.displayName ?? "",
  network: m.network,
  assetType: m.assetType,
  symbol: m.symbol ?? "",
  contractAddress: m.contractAddress ?? "",
  decimals: m.decimals == null ? "" : String(m.decimals),
  requiredConfirmations: String(m.requiredConfirmations ?? "0"),
  minAmount: m.minAmount ?? "",
  verifier: m.verifier,
});

export default function AdminDepositMethodsPage() {
  const { showToast } = useApp();
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .get("/api/admin/deposit-methods")
      .then((d) => setMethods(d.methods))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(load, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm(toForm(m));
    // The form is the first card; on a phone it is otherwise off-screen and the
    // Edit button would look like it did nothing.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isToken = form.assetType === "token";
      const payload = {
        ...form,
        // A native coin has no contract and no decimals; sending stale token
        // values would be meaningless and the server nulls them anyway.
        decimals: isToken ? Number(form.decimals) : null,
        contractAddress: isToken ? form.contractAddress.trim() : null,
        requiredConfirmations: Number(form.requiredConfirmations),
        // Left blank means "no minimum" — as a string it would fail the decimal
        // check (§18 keeps amounts as strings, never floats).
        minAmount: form.minAmount.trim() === "" ? null : form.minAmount.trim(),
      };

      if (editingId) {
        // The id is the method's identity and every stored address hangs off
        // it, so it is not in the payload — the server ignores it regardless.
        await api.put(`/api/admin/deposit-methods/${editingId}`, payload);
        showToast(`Method ${editingId} updated`);
      } else {
        await api.post("/api/admin/deposit-methods", payload);
        showToast(`Method ${form.id} created`);
      }

      cancelEdit();
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m) => {
    const status = m.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/api/admin/deposit-methods/${m.id}/status`, { status });
      showToast(`${m.name} ${status}`);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const isToken = form.assetType === "token";

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>Deposit methods</h1>
        <p className={styles.sub}>
          Each method names the network, asset and verifier used to check transactions
          directly against the blockchain.
        </p>
      </header>

      <div className={styles.layout}>
        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>
            {editingId ? <Pencil size={18} /> : <Plus size={18} />}
            {editingId ? `Edit ${editingId}` : "Add method"}
          </h2>
          <form onSubmit={submit}>
            <Input
              label="Method ID"
              value={form.id}
              placeholder="usdt_bep20"
              disabled={!!editingId}
              helper={
                editingId
                  ? "The ID cannot be changed — addresses and transactions reference it."
                  : "Lowercase, numbers and underscore. Cannot be changed later."
              }
              onChange={(e) =>
                setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))
              }
            />
            {/* Spec §7 lists "Method name" and "Display name" separately: the
                first is what the admin files it under, the second is what a user
                or peer reads. */}
            <Input label="Method name" value={form.name} placeholder="USDT BEP20" onChange={set("name")} />
            <Input
              label="Display name"
              value={form.displayName}
              placeholder="Tether (BEP20)"
              helper="Optional. Shown to users and peers; falls back to the method name."
              onChange={set("displayName")}
            />
            <Input
              type="select"
              label="Network"
              value={form.network}
              options={NETWORKS.map((n) => ({ value: n, label: n }))}
              helper={
                editingId
                  ? "Cannot be changed once this method has addresses."
                  : undefined
              }
              onChange={set("network")}
            />
            <Input
              type="select"
              label="Asset type"
              value={form.assetType}
              options={[
                { value: "token", label: "Token (e.g. USDT)" },
                { value: "native", label: "Native coin (e.g. BNB)" },
              ]}
              onChange={set("assetType")}
            />
            <Input label="Symbol" value={form.symbol} placeholder="USDT" onChange={set("symbol")} />

            {/* Spec §7: a contract and decimals only mean something for tokens. */}
            {isToken && (
              <>
                <Input
                  label="Token contract address"
                  value={form.contractAddress}
                  placeholder="0x…"
                  helper="Verified independently on every transaction (§16)."
                  onChange={set("contractAddress")}
                />
                <Input
                  label="Token decimals"
                  value={form.decimals}
                  inputMode="numeric"
                  onChange={set("decimals")}
                />
              </>
            )}

            <Input
              label="Required confirmations"
              value={form.requiredConfirmations}
              inputMode="numeric"
              onChange={set("requiredConfirmations")}
            />
            {/* Spec §7 "minimum amount if required". The verifiers enforce this
                on every transaction; leaving it blank means no minimum. */}
            <Input
              label="Minimum amount"
              value={form.minAmount}
              placeholder="10"
              inputMode="decimal"
              helper="Optional. Deposits below this are rejected. Blank means no minimum."
              onChange={set("minAmount")}
            />
            <Input
              type="select"
              label="Verifier"
              value={form.verifier}
              options={VERIFIERS.map((v) => ({ value: v, label: v }))}
              helper="Must match the network and asset type above."
              onChange={set("verifier")}
            />

            <Button type="submit" size="lg" fullWidth icon={editingId ? Save : Layers} loading={saving}>
              {editingId ? "Save changes" : "Create method"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" fullWidth icon={X} onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </form>
        </Card>

        <Card padding="sm" className={styles.listCard}>
          <h2 className={styles.sectionTitle}>
            <Layers size={18} /> All methods <Badge variant="neutral" size="sm">{methods.length}</Badge>
          </h2>

          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : !methods.length ? (
            <p className={styles.empty}>No deposit methods configured yet.</p>
          ) : (
            <div className={styles.list}>
              {methods.map((m) => (
                <div key={m.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowName}>{m.name}</span>
                    <span className={styles.rowSub}>
                      {m.network} · {m.symbol} · {m.assetType} · {m.requiredConfirmations} conf
                      {m.minAmount ? ` · min ${m.minAmount}` : ""}
                    </span>
                    {/* "active" alone does not mean usable: a method with no
                        active address is hidden from every user and peer, and
                        reading "active" here while the peer panel says there is
                        nothing available is just confusing. Say why. */}
                    {m.status === "active" && m.activeAddressCount === 0 && (
                      <span className={styles.rowWarn}>
                        No active receiving address — hidden from users and peers.{" "}
                        <Link href="/admin/deposit-address">Add one</Link>
                      </span>
                    )}
                    {m.activeAddressCount > 0 && (
                      <span className={styles.rowSub}>
                        {m.activeAddressCount} active address
                        {m.activeAddressCount > 1 ? "es" : ""}
                        {m.addressCount > m.activeAddressCount
                          ? ` · ${m.addressCount - m.activeAddressCount} disabled`
                          : ""}
                      </span>
                    )}
                  </div>
                  <Badge variant={m.status === "active" ? "success" : "neutral"} size="sm">
                    {m.status}
                  </Badge>
                  <div className={styles.rowActions}>
                    <Button variant="outline" size="sm" icon={Pencil} onClick={() => startEdit(m)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggle(m)}>
                      {m.status === "active" ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
