"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Input from "./components/Input";
import Button from "./components/Button";
import Logo from "./components/Logo";
import { BRAND } from "@/lib/config";
import { api } from "@/lib/api";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: null }));
  };

  // Spec §3.3: the password is checked server-side. This form previously ran a
  // 700ms timer and pushed you into the panel — any email and any password got
  // you in, because nothing was ever verified.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "Email or username is required";
    if (!form.password.trim()) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await api.post("/api/user/login", { identifier: form.email, password: form.password });
      router.replace("/pa");
      router.refresh();
    } catch (err) {
      // One message for both fields: saying which half was wrong would confirm
      // whether an account exists.
      setErrors({ password: err.message });
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glowA} />
      <div className={styles.glowB} />

      <main className={styles.wrapper}>
        <div className={`${styles.card} animate-in`}>
          <div className={styles.brand}>
            <Logo size={88} />
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your {BRAND} account</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Not type="email": the API accepts an email OR a username as the
                identifier, and the email type would reject the latter. */}
            <Input
              label="Email or username"
              icon={Mail}
              value={form.email}
              onChange={update("email")}
              error={errors.email}
              autoComplete="username"
            />
            <Input
              type="password"
              label="Password"
              icon={Lock}
              value={form.password}
              onChange={update("password")}
              error={errors.password}
              autoComplete="current-password"
            />

            {/* "Forgot password?" linked to "#" and the Google/Apple/Facebook
                buttons had no handler — none of those flows exist, so offering
                them just fails silently when clicked. */}
            <Button type="submit" size="lg" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          <p className={styles.footerText}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.link}>
              Register
            </Link>
          </p>
        </div>

        <p className={styles.copyright}>
          © 2025 {BRAND}. All rights reserved.
        </p>
      </main>
    </div>
  );
}



