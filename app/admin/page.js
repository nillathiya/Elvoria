"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { api } from "@/lib/api";
import styles from "./page.module.css";

// Spec §3.1: admin login is a 6-digit numeric PIN, verified server-side.
// Nothing about the credential exists in this file — the previous build
// compared a hardcoded password here in the browser, which shipped it to
// every visitor.
export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [provisioned, setProvisioned] = useState(true);

  useEffect(() => {
    api
      .get("/api/admin/status")
      .then((d) => setProvisioned(d.provisioned))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[0-9]{6}$/.test(pin)) {
      setError("Enter your 6-digit PIN");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/admin/login", { pin });
      router.replace("/admin/deposit-address");
      router.refresh(); // re-run the server layout so it sees the new cookie
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
          <ShieldCheck size={18} />
          Admin panel
        </div>
        <h1 className={styles.title}>Enter your PIN</h1>
        <p className={styles.sub}>Restricted area — administrators only.</p>

        {!provisioned && (
          <div className={styles.error}>
            No admin PIN has been set yet. Run <code>npm run set-admin-pin</code> on the server.
          </div>
        )}

        <div className={styles.fields}>
          <Input
            type="password"
            label="6-digit PIN"
            value={pin}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            // Non-digits are dropped as typed, so the field can only ever hold
            // something the server would accept.
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Button type="submit" size="lg" fullWidth icon={LogIn} loading={loading} disabled={!provisioned}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
