"use client";

import { useState } from "react";
import {
  Lock,
  Check,
  Circle,
  ShieldCheck,
  Smartphone,
  Monitor,
  LogOut,
} from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import Input from "@/app/components/Input";
import { useApp } from "@/app/context/AppContext";
import { securityChecklist, securitySessions } from "@/lib/demoData";
import styles from "./page.module.css";

export default function SecurityPage() {
  const { showToast, user: sessionUser } = useApp();

  // "Email confirmed" names an address, and it should be the address of the
  // person reading the page. The rest of the checklist is demo.
  const checklist = securityChecklist.map((c) =>
    c.key === "email" && sessionUser?.email ? { ...c, desc: sessionUser.email } : c
  );

  const doneCount = checklist.filter((c) => c.done).length;
  const score = Math.round((doneCount / checklist.length) * 100);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [twoFA, setTwoFA] = useState(true);

  const setField = (key) => (e) =>
    setPw((prev) => ({ ...prev, [key]: e.target.value }));

  const updatePassword = () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    setPw({ current: "", next: "", confirm: "" });
    showToast("Password updated");
  };

  const R = 52;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Security</h1>
          <p className={styles.sub}>
            Protect your account and manage active sessions
          </p>
        </div>
      </header>

      {/* Security score */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Security score</h3>
        <div className={styles.scoreLayout}>
          <div className={styles.ringWrap}>
            <svg viewBox="0 0 120 120" className={styles.ring} role="img" aria-label={`Security score ${score}%`}>
              <circle
                cx="60"
                cy="60"
                r={R}
                className={styles.ringTrack}
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r={R}
                className={styles.ringFill}
                fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - score / 100)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className={styles.ringLabel}>
              <span className={styles.ringValue}>{score}%</span>
              <span className={styles.ringCaption}>secure</span>
            </div>
          </div>
          <div className={styles.checklist}>
            {checklist.map((c) => (
              <div key={c.key} className={styles.checkRow}>
                <span
                  className={[styles.checkIcon, c.done ? styles.checkDone : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {c.done ? <Check size={14} /> : <Circle size={14} />}
                </span>
                <div className={styles.checkText}>
                  <div className={styles.checkLabel}>{c.label}</div>
                  <div className={styles.checkDesc}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className={styles.grid}>
        {/* Change password */}
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>Change password</h3>
          <div className={styles.pwForm}>
            <Input
              type="password"
              label="Current password"
              icon={Lock}
              value={pw.current}
              onChange={setField("current")}
            />
            <Input
              type="password"
              label="New password"
              icon={Lock}
              value={pw.next}
              onChange={setField("next")}
            />
            <Input
              type="password"
              label="Confirm new password"
              icon={Lock}
              value={pw.confirm}
              onChange={setField("confirm")}
            />
            <Button onClick={updatePassword}>Update password</Button>
          </div>
        </Card>

        {/* Two-factor */}
        <Card className={styles.section}>
          <div className={styles.twoFaHead}>
            <h3 className={styles.sectionTitle}>Two-factor authentication</h3>
            {twoFA && (
              <Badge variant="success" icon={ShieldCheck}>
                Enabled
              </Badge>
            )}
          </div>
          <p className={styles.twoFaDesc}>
            Add an extra layer of security by requiring a code from your
            authenticator app each time you sign in.
          </p>
          <div className={styles.twoFaRow}>
            <span className={styles.secIcon}>
              <Smartphone size={18} />
            </span>
            <div className={styles.secText}>
              <div className={styles.secTitle}>Authenticator app</div>
              <div className={styles.secSub}>
                {twoFA ? "Active — codes required at sign-in" : "Not configured"}
              </div>
            </div>
            <button
              className={[styles.toggle, twoFA ? styles.toggleOn : ""]
                .filter(Boolean)
                .join(" ")}
              role="switch"
              aria-checked={twoFA}
              aria-label="Toggle two-factor authentication"
              onClick={() => {
                setTwoFA((v) => !v);
                showToast(
                  `Two-factor authentication ${!twoFA ? "enabled" : "disabled"}`
                );
              }}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </Card>
      </div>

      {/* Active sessions */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Active sessions</h3>
        <div className={styles.sessionList}>
          {securitySessions.map((s) => (
            <div key={s.id} className={styles.sessionRow}>
              <span className={styles.secIcon}>
                {s.device.includes("iPhone") || s.device.includes("Android") ? (
                  <Smartphone size={18} />
                ) : (
                  <Monitor size={18} />
                )}
              </span>
              <div className={styles.sessionText}>
                <div className={styles.sessionDevice}>{s.device}</div>
                <div className={styles.sessionMeta}>
                  {s.location} · {s.ip}
                </div>
                <div className={styles.sessionTime}>{s.lastActive}</div>
              </div>
              {s.current ? (
                <Badge variant="success" icon={Check}>
                  This device
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showToast(`Signed out ${s.device}`)}
                >
                  Log out
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className={styles.sessionFooter}>
          <Button
            variant="outline"
            icon={LogOut}
            onClick={() => showToast("Signed out all other sessions")}
          >
            Log out all other sessions
          </Button>
        </div>
      </Card>
    </div>
  );
}
