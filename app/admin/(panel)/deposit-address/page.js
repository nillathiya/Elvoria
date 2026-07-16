"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Wallet, X, Pencil } from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import styles from "./page.module.css";

// Spec §8: each deposit method holds MANY receiving addresses, with an
// "Add More" flow. The previous version kept one address per currency in
// localStorage, which no server could ever verify a transaction against.
export default function AdminDepositAddressPage() {
  const { showToast } = useApp();
  const [methods, setMethods] = useState([]);
  const [methodId, setMethodId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [drafts, setDrafts] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editAddr, setEditAddr] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/deposit-methods")
      .then((d) => {
        setMethods(d.methods);
        if (d.methods.length) setMethodId(d.methods[0].id);
      })
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const loadAddresses = useCallback(
    (id) => {
      if (!id) return;
      api
        .get(`/api/admin/deposit-methods/${id}/addresses`)
        .then((d) => setAddresses(d.addresses))
        .catch((err) => showToast(err.message, "error"));
    },
    [showToast]
  );

  useEffect(() => {
    loadAddresses(methodId);
    setDrafts([""]);
    setEditing(null);
  }, [methodId, loadAddresses]);

  const method = methods.find((m) => m.id === methodId);

  const saveAll = async () => {
    const list = drafts.map((d) => d.trim()).filter(Boolean);
    if (!list.length) return showToast("Enter at least one address", "error");

    setSaving(true);
    try {
      // The whole batch goes in one request: the server validates every entry
      // before writing any, so one typo cannot half-save the batch.
      const { addresses: created } = await api.post(
        `/api/admin/deposit-methods/${methodId}/addresses`,
        { addresses: list }
      );
      showToast(`${created.length} address${created.length > 1 ? "es" : ""} added`);
      setDrafts([""]);
      loadAddresses(methodId);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Spec §8 "edit address". The server refuses this once a deposit request has
  // advertised the address or a transaction has landed on it — rewriting it
  // then would point the record at a wallet the user was never shown. The
  // ConflictError surfaces as a toast rather than being pre-empted here, so the
  // check that matters stays the server's.
  const saveEdit = async (addr) => {
    const address = editAddr.trim();
    if (!address) return showToast("Address cannot be empty", "error");
    if (address === addr.address) {
      setEditing(null);
      return;
    }
    try {
      await api.put(`/api/admin/deposit-addresses/${addr.id}`, { address });
      showToast("Address updated");
      setEditing(null);
      setEditAddr("");
      loadAddresses(methodId);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const toggle = async (addr) => {
    const status = addr.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/api/admin/deposit-addresses/${addr.id}/status`, { status });
      showToast(`Address ${status === "active" ? "enabled" : "disabled"}`);
      loadAddresses(methodId);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const remove = async (addr) => {
    try {
      await api.del(`/api/admin/deposit-addresses/${addr.id}`);
      showToast("Address deleted");
      loadAddresses(methodId);
    } catch (err) {
      // The API refuses to delete an address a deposit request already used.
      showToast(err.message, "error");
    }
  };

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Deposit addresses</h1>
          <p className={styles.sub}>
            Configure the receiving wallets for each method. Clients are shown one active
            address at random, and only these addresses are accepted when a transaction is
            verified.
          </p>
        </div>
      </header>

      {loading ? (
        <Card>
          <p className={styles.empty}>Loading…</p>
        </Card>
      ) : !methods.length ? (
        <Card>
          <p className={styles.empty}>
            No deposit methods yet — create one on the Deposit methods page first.
          </p>
        </Card>
      ) : (
        <div className={styles.layout}>
          <Card className={styles.formCard}>
            <h2 className={styles.sectionTitle}>
              <Wallet size={18} /> Add addresses
            </h2>

            <Input
              type="select"
              value={methodId}
              onChange={(e) => setMethodId(e.target.value)}
              options={methods.map((m) => ({
                value: m.id,
                label: `${m.name} · ${m.network}${m.status !== "active" ? " (inactive)" : ""}`,
              }))}
            />

            {drafts.map((value, i) => (
              <div key={i} className={styles.draftRow}>
                {/* Input uses a floating label, so without one the field renders
                    as an unmarked empty box and the placeholder stays hidden —
                    which is no way to label the field that decides where real
                    money lands. */}
                <Input
                  label={
                    drafts.length > 1
                      ? `${method?.network ?? ""} address ${i + 1}`.trim()
                      : `${method?.network ?? ""} receiving address`.trim()
                  }
                  value={value}
                  spellCheck={false}
                  helper={
                    i === 0
                      ? `A ${method?.network} wallet you control. ${
                          method?.network === "TRON" ? "Starts with T." : "Starts with 0x."
                        }`
                      : undefined
                  }
                  onChange={(e) =>
                    setDrafts((d) => d.map((v, j) => (j === i ? e.target.value : v)))
                  }
                />
                {drafts.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeDraft}
                    aria-label="Remove this address field"
                    onClick={() => setDrafts((d) => d.filter((_, j) => j !== i))}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}

            <Button variant="outline" fullWidth icon={Plus} onClick={() => setDrafts((d) => [...d, ""])}>
              Add More
            </Button>
            <Button size="lg" fullWidth icon={Wallet} loading={saving} onClick={saveAll} className={styles.saveBtn}>
              Save addresses
            </Button>
          </Card>

          <Card padding="sm" className={styles.listCard}>
            <h2 className={styles.sectionTitle}>
              Configured addresses <Badge variant="neutral" size="sm">{addresses.length}</Badge>
            </h2>

            {!addresses.length ? (
              <p className={styles.empty}>
                No addresses for this method yet. Clients cannot deposit until one is active.
              </p>
            ) : (
              <div className={styles.list}>
                {addresses.map((a) => (
                  <div key={a.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.addr} title={a.address}>{a.address}</span>
                      <Badge variant={a.status === "active" ? "success" : "neutral"} size="sm">
                        {a.status}
                      </Badge>
                    </div>
                    <div className={styles.rowActions}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Pencil}
                        onClick={() => {
                          setEditing(editing === a.id ? null : a.id);
                          setEditAddr(a.address);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggle(a)}>
                        {a.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="outline" size="sm" icon={Trash2} onClick={() => remove(a)}>
                        Delete
                      </Button>
                    </div>

                    {editing === a.id && (
                      <div className={styles.editRow}>
                        <Input
                          label={`${method?.network ?? ""} receiving address`.trim()}
                          value={editAddr}
                          spellCheck={false}
                          onChange={(e) => setEditAddr(e.target.value)}
                        />
                        <Button size="sm" onClick={() => saveEdit(a)}>Save</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
