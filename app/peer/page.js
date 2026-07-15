"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { api } from "@/lib/api";
import styles from "../admin/page.module.css";

// Spec §3.2: Peer ID + 6-digit numeric PIN. There is no "create account" link
// here by design — peers cannot self-register (§26.7); only an admin can make
// one.
export default function PeerLoginPage() {
  const router = useRouter();
  const [peerCode, setPeerCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[0-9]{6}$/.test(pin)) {
      setError("Enter your 6-digit PIN");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/peer/login", { peerCode, pin });
      router.replace("/peer/verify");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.brand}>
          <Logo size={80} />
        </div>
        <div className={styles.badge}>
          <KeyRound size={18} />
          Peer panel
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.sub}>Peer accounts are created by an administrator.</p>

        <div className={styles.fields}>
          <Input
            label="Peer ID"
            value={peerCode}
            placeholder="PEER001"
            autoComplete="username"
            onChange={(e) => setPeerCode(e.target.value.toUpperCase().slice(0, 32))}
          />
          <Input
            type="password"
            label="6-digit PIN"
            value={pin}
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Button type="submit" size="lg" fullWidth icon={LogIn} loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
