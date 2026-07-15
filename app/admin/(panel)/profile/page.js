"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import styles from "./page.module.css";

// Spec §3.1: the PIN is 6 numeric digits, checked server-side only. This page
// never learns the current PIN — it forwards both values and lets the API
// decide, so no credential logic lives in the browser.
export default function AdminProfilePage() {
  const { showToast } = useApp();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onlyDigits = (setter) => (e) => setter(e.target.value.replace(/\D/g, "").slice(0, 6));

  const update = async () => {
    if (!/^[0-9]{6}$/.test(next)) return showToast("New PIN must be exactly 6 digits", "error");
    if (next !== confirm) return showToast("New PINs do not match", "error");

    setLoading(true);
    try {
      await api.post("/api/admin/change-pin", { currentPin: cur, newPin: next });
      setCur("");
      setNext("");
      setConfirm("");
      showToast("PIN updated successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.sub}>Manage your administrator account</p>
      </header>

      <div className={styles.layout}>
        <Card className={styles.profileCard}>
          <div className={styles.avatar}>A</div>
          <div className={styles.info}>
            <div className={styles.name}>Administrator</div>
            <div className={styles.role}>
              <Badge variant="warning" icon={ShieldCheck}>Administrator</Badge>
            </div>
          </div>
          <div className={styles.metaList}>
            <Meta icon={ShieldCheck} label="Role" value="Administrator · Full access" />
            <Meta icon={KeyRound} label="Sign-in" value="6-digit PIN" />
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>
            <KeyRound size={18} /> Change PIN
          </h2>
          <div className={styles.fields}>
            <Input
              type="password"
              label="Current PIN"
              value={cur}
              inputMode="numeric"
              maxLength={6}
              onChange={onlyDigits(setCur)}
            />
            <Input
              type="password"
              label="New PIN"
              value={next}
              inputMode="numeric"
              maxLength={6}
              helper="Exactly 6 digits, numbers only"
              onChange={onlyDigits(setNext)}
            />
            <Input
              type="password"
              label="Confirm new PIN"
              value={confirm}
              inputMode="numeric"
              maxLength={6}
              onChange={onlyDigits(setConfirm)}
            />
          </div>
          <Button size="lg" icon={KeyRound} loading={loading} onClick={update} className={styles.updateBtn}>
            Update PIN
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaIcon}><Icon size={16} /></span>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}
