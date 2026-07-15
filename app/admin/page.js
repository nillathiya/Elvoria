"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { checkAdminLogin, isAdminAuthed, setAdminAuthed } from "@/lib/adminConfig";
import styles from "./page.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → go straight to the panel.
  useEffect(() => {
    if (isAdminAuthed()) router.replace("/admin/deposit-address");
  }, [router]);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!checkAdminLogin(username, password)) {
      setError("Invalid username or password");
      return;
    }
    setLoading(true);
    setAdminAuthed(true);
    setTimeout(() => router.push("/admin/deposit-address"), 400);
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
        <h1 className={styles.title}>Sign in to continue</h1>
        <p className={styles.sub}>Restricted area — administrators only.</p>

        <div className={styles.fields}>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
