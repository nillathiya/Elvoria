"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Phone } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";
import Logo from "../components/Logo";
import { BRAND, countries } from "@/lib/mockData";
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
    phone: "",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    if (!form.password.trim()) next.password = "Password is required";
    else if (strength < 2) next.password = "Choose a stronger password";
    if (!agree) next.agree = "You must accept the terms";
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

            <div className={styles.phoneRow}>
              <div className={styles.dial}>{dial}</div>
              <Input
                type="tel"
                label="Phone number"
                icon={Phone}
                value={form.phone}
                onChange={update("phone")}
                error={errors.phone}
                autoComplete="tel"
              />
            </div>

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
