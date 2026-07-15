"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, Plus } from "lucide-react";
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
  network: "BSC",
  assetType: "token",
  symbol: "",
  contractAddress: "",
  decimals: "18",
  requiredConfirmations: "5",
  verifier: "bsc-token-verifier",
};

export default function AdminDepositMethodsPage() {
  const { showToast } = useApp();
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(EMPTY);
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

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        decimals: form.assetType === "token" ? Number(form.decimals) : null,
        contractAddress: form.assetType === "token" ? form.contractAddress.trim() : null,
        requiredConfirmations: Number(form.requiredConfirmations),
      };
      await api.post("/api/admin/deposit-methods", payload);
      showToast(`Method ${form.id} created`);
      setForm(EMPTY);
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
            <Plus size={18} /> Add method
          </h2>
          <form onSubmit={create}>
            <Input
              label="Method ID"
              value={form.id}
              placeholder="usdt_bep20"
              helper="Lowercase, numbers and underscore. Cannot be changed later."
              onChange={(e) =>
                setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))
              }
            />
            <Input label="Display name" value={form.name} placeholder="USDT BEP20" onChange={set("name")} />
            <Input
              type="select"
              label="Network"
              value={form.network}
              options={NETWORKS.map((n) => ({ value: n, label: n }))}
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
            <Input
              type="select"
              label="Verifier"
              value={form.verifier}
              options={VERIFIERS.map((v) => ({ value: v, label: v }))}
              helper="Must match the network and asset type above."
              onChange={set("verifier")}
            />

            <Button type="submit" size="lg" fullWidth icon={Layers} loading={saving}>
              Create method
            </Button>
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
                    </span>
                  </div>
                  <Badge variant={m.status === "active" ? "success" : "neutral"} size="sm">
                    {m.status}
                  </Badge>
                  <div className={styles.rowActions}>
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
