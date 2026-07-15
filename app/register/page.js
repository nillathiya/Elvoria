"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, AtSign } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { BRAND, countries } from "@/lib/config";
import { api } from "@/lib/api";
import styles from "./page.module.css";

const strengthLabels = ["Too weak", "Weak", "Medium", "Strong", "Very strong"];
const strengthColors = ["#FF5252", "#FF5252", "#FFB300", "#FFDE02", "#22C55E"];

function scorePassword(pw) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    country: "US",
    email: "",
    username: "",
    password: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const dial = useMemo(
    () => countries.find((c) => c.code === form.country)?.dial ?? "+1",
    [form.country]
  );

  const strength = scorePassword(form.password);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: null }));
  };

  // Spec §2.3 / §3.3: this actually creates an account now. It previously ran
  // a 700ms timer and redirected — no account was created and no password was
  // ever checked, so the "signed-in" panel was open to anyone.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.username.trim()) next.username = "Username is required";
    if (!form.password.trim()) next.password = "Password is required";
    else if (strength < 2) next.password = "Choose a stronger password";
    if (!agree) next.agree = "You must accept the terms";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await api.post("/api/user/register", {
        email: form.email,
        username: form.username,
        password: form.password,
      });
      // Registration does not issue a session (§3.3) — log in with the
      // credentials just created, so one path owns lockout accounting.
      await api.post("/api/user/login", { identifier: form.email, password: form.password });
      router.replace("/pa");
      router.refresh();
    } catch (err) {
      // Duplicate email/username comes back as a 409 from the server, which is
      // the only place that can know.
      setErrors({ email: err.message });
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
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Start trading with {BRAND} in minutes</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Input
              type="select"
              label="Country of residence"
              value={form.country}
              onChange={update("country")}
              options={countries.map((c) => ({
                value: c.code,
                label: `${c.flag}  ${c.name}`,
              }))}
            />

            <Input
              type="email"
              label="Email address"
              icon={Mail}
              value={form.email}
              onChange={update("email")}
              error={errors.email}
              autoComplete="email"
            />

            {/* Username replaces the old phone field: the API stores email +
                username + password, and a phone number it never keeps would be
                asking for data with nowhere to go. */}
            <Input
              label="Username"
              icon={AtSign}
              value={form.username}
              onChange={update("username")}
              error={errors.username}
              helper="3-32 characters. You can sign in with this or your email."
              autoComplete="username"
            />

            <div>
              <Input
                type="password"
                label="Password"
                icon={Lock}
                value={form.password}
                onChange={update("password")}
                error={errors.password}
                autoComplete="new-password"
              />
              {form.password && (
                <div className={styles.strength}>
                  <div className={styles.strengthBars}>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={styles.strengthBar}
                        style={{
                          background:
                            i < strength ? strengthColors[strength] : "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className={styles.strengthLabel}
                    style={{ color: strengthColors[strength] }}
                  >
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setErrors((er) => ({ ...er, agree: null }));
                }}
                className={styles.checkbox}
              />
              <span className={styles.checkboxBox} aria-hidden="true" />
              <span className={styles.checkboxText}>
                I agree to the{" "}
                <a href="#" className={styles.link}>
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a href="#" className={styles.link}>
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agree && <span className={styles.errorText}>{errors.agree}</span>}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>

          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link href="/" className={styles.link}>
              Sign In
            </Link>
          </p>
        </div>

        <p className={styles.copyright}>© 2025 {BRAND}. All rights reserved.</p>
      </main>
    </div>
  );
}
