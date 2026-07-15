"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Input from "./components/Input";
import Button from "./components/Button";
import Logo from "./components/Logo";
import { BRAND } from "@/lib/mockData";
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.password.trim()) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => router.push("/pa/trading/accounts"), 700);
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
            <Input
              type="email"
              label="Email address"
              icon={Mail}
              value={form.email}
              onChange={update("email")}
              error={errors.email}
              autoComplete="email"
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

            <div className={styles.forgotRow}>
              <a href="#" className={styles.forgot}>
                Forgot password?
              </a>
            </div>

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          <div className={styles.divider}>
            <span>or continue with</span>
          </div>

          <div className={styles.socials}>
            <button className={styles.social} aria-label="Continue with Google">
              <GoogleIcon />
            </button>
            <button className={styles.social} aria-label="Continue with Apple">
              <AppleIcon />
            </button>
            <button className={styles.social} aria-label="Continue with Facebook">
              <FacebookIcon />
            </button>
          </div>

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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M16.36 12.78c.02 2.5 2.18 3.32 2.2 3.33-.02.06-.34 1.18-1.13 2.33-.68.99-1.4 1.98-2.53 2-1.11.02-1.47-.66-2.74-.66-1.27 0-1.66.64-2.72.68-1.09.04-1.92-1.07-2.61-2.06-1.4-2.03-2.48-5.74-1.04-8.25a4.06 4.06 0 0 1 3.43-2.09c1.07-.02 2.08.72 2.74.72.65 0 1.88-.89 3.17-.76.54.02 2.06.22 3.03 1.64-.08.05-1.81 1.06-1.8 3.15M14.3 4.66c.59-.71.98-1.7.87-2.69-.85.04-1.87.57-2.48 1.28-.54.63-1.02 1.64-.89 2.61.95.07 1.91-.48 2.5-1.2" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}
