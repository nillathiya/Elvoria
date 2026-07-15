"use client";

import { useState } from "react";
import { KeyRound, UserRound, ShieldCheck } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import { useApp } from "../../context/AppContext";
import { ADMIN_CREDENTIALS, getAdminPassword, setAdminPassword } from "@/lib/adminConfig";
import styles from "./page.module.css";

export default function AdminProfilePage() {
  const { showToast } = useApp();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const update = () => {
    if (cur !== getAdminPassword()) return showToast("Current password is incorrect", "error");
    if (next.length < 6) return showToast("New password must be at least 6 characters", "error");
    if (next !== confirm) return showToast("New passwords do not match", "error");
    setLoading(true);
    setTimeout(() => {
      setAdminPassword(next);
      setLoading(false);
      setCur("");
      setNext("");
      setConfirm("");
      showToast("Password updated successfully");
    }, 600);
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
            <div className={styles.name}>{ADMIN_CREDENTIALS.username}</div>
            <div className={styles.role}>
              <Badge variant="warning" icon={ShieldCheck}>Administrator</Badge>
            </div>
          </div>
          <div className={styles.metaList}>
            <Meta icon={UserRound} label="Username" value={ADMIN_CREDENTIALS.username} />
            <Meta icon={ShieldCheck} label="Role" value="Administrator · Full access" />
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>
            <KeyRound size={18} /> Change password
          </h2>
          <div className={styles.fields}>
            <Input type="password" label="Current password" value={cur} onChange={(e) => setCur(e.target.value)} />
            <Input type="password" label="New password" value={next} onChange={(e) => setNext(e.target.value)} helper="At least 6 characters" />
            <Input type="password" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button size="lg" icon={KeyRound} loading={loading} onClick={update} className={styles.updateBtn}>
            Update password
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
