"use client";

import { useState, useEffect } from "react";
import {
  BadgeCheck,
  Mail,
  Phone,
  Fingerprint,
  Home,
  Lock,
  Smartphone,
  ScrollText,
  Check,
  Clock,
  X,
  Pencil,
} from "lucide-react";
import { Sun, Moon } from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import { useApp } from "../../context/AppContext";
import { user as demoUser, verificationSteps } from "@/lib/demoData";
import styles from "./page.module.css";

const verifyIcons = {
  email: Mail,
  phone: Phone,
  identity: Fingerprint,
  address: Home,
};

export default function SettingsPage() {
  const { theme, toggleTheme, showToast, user: sessionUser } = useApp();

  // Name and email come from the session — this is the user's own record.
  // Phone, country and date of birth are demo values: the system does not
  // collect them.
  const [info, setInfo] = useState({
    "Full Name": sessionUser?.username ?? demoUser.name,
    Email: sessionUser?.email ?? demoUser.email,
    Phone: demoUser.phone,
    Country: demoUser.country,
    "Date of Birth": demoUser.dob,
  });

  // The session arrives after the first render, and useState's initial value is
  // only read once — without this the demo name would stick permanently.
  useEffect(() => {
    if (!sessionUser) return;
    setInfo((prev) => ({
      ...prev,
      "Full Name": sessionUser.username,
      Email: sessionUser.email,
    }));
  }, [sessionUser]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [twoFA, setTwoFA] = useState(true);
  const [pwModal, setPwModal] = useState(false);

  const flash = (msg) => showToast(msg);

  const startEdit = (key) => {
    setEditing(key);
    setDraft(info[key]);
  };
  const saveEdit = (key) => {
    setInfo((prev) => ({ ...prev, [key]: draft }));
    setEditing(null);
    flash(`${key} updated`);
  };

  const editableKeys = ["Full Name", "Email", "Phone"];

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>Profile &amp; Settings</h1>
        <p className={styles.sub}>Manage your personal information and security</p>
      </header>

      {/* Profile header */}
      <Card variant="glass" className={styles.profileCard}>
        <div className={styles.avatar}>{user.initials}</div>
        <div className={styles.profileInfo}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{user.name}</h2>
            <Badge variant="success" icon={BadgeCheck}>Fully Verified</Badge>
          </div>
          <p className={styles.email}>{user.email}</p>
          <div className={styles.metaRow}>
            <span>ID: <b>{user.clientId}</b></span>
            <span className={styles.dot}>·</span>
            <span>Member since {user.memberSince}</span>
          </div>
        </div>
      </Card>

      <div className={styles.grid}>
        {/* Personal Information */}
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.infoList}>
            {Object.entries(info).map(([key, value]) => (
              <div key={key} className={styles.infoRow}>
                <span className={styles.infoLabel}>{key}</span>
                {editing === key ? (
                  <div className={styles.editRow}>
                    <input
                      className={styles.editInput}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      autoFocus
                    />
                    <button className={styles.iconSave} onClick={() => saveEdit(key)} aria-label="Save">
                      <Check size={16} />
                    </button>
                    <button className={styles.iconCancel} onClick={() => setEditing(null)} aria-label="Cancel">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.valueRow}>
                    <span className={styles.infoValue}>{value}</span>
                    {editableKeys.includes(key) && (
                      <button className={styles.editBtn} onClick={() => startEdit(key)}>
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Verification */}
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>Verification Status</h3>
          <div className={styles.verifyList}>
            {verificationSteps.map((v) => {
              const Icon = verifyIcons[v.key];
              const done = v.status === "Verified";
              return (
                <div key={v.key} className={styles.verifyRow}>
                  <span className={styles.verifyIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.verifyLabel}>{v.label}</span>
                  <Badge variant={done ? "success" : "warning"} icon={done ? Check : Clock}>
                    {v.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Security */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Security</h3>
        <div className={styles.securityList}>
          <div className={styles.securityRow}>
            <span className={styles.secIcon}><Lock size={18} /></span>
            <div className={styles.secText}>
              <div className={styles.secTitle}>Password</div>
              <div className={styles.secSub}>••••••••••</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPwModal(true)}>Change</Button>
          </div>

          <div className={styles.securityRow}>
            <span className={styles.secIcon}><Smartphone size={18} /></span>
            <div className={styles.secText}>
              <div className={styles.secTitle}>Two-Factor Authentication</div>
              <div className={styles.secSub}>{twoFA ? "Enabled" : "Disabled"}</div>
            </div>
            <button
              className={[styles.toggle, twoFA ? styles.toggleOn : ""].filter(Boolean).join(" ")}
              onClick={() => {
                setTwoFA((v) => !v);
                flash(`Two-factor ${!twoFA ? "enabled" : "disabled"}`);
              }}
              role="switch"
              aria-checked={twoFA}
              aria-label="Toggle two-factor authentication"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.securityRow}>
            <span className={styles.secIcon}><ScrollText size={18} /></span>
            <div className={styles.secText}>
              <div className={styles.secTitle}>Login History</div>
              <div className={styles.secSub}>Last login: Today, 09:42 · New York</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => flash("Login history — coming soon")}>
              View →
            </Button>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        <div className={styles.securityList}>
          <div className={styles.securityRow}>
            <span className={styles.secIcon}>{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}</span>
            <div className={styles.secText}>
              <div className={styles.secTitle}>Theme</div>
              <div className={styles.secSub}>{theme === "dark" ? "Dark (navy)" : "Light"}</div>
            </div>
            <button
              className={[styles.toggle, theme === "dark" ? styles.toggleOn : ""].filter(Boolean).join(" ")}
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Toggle dark mode"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>
      </Card>

      {/* Change password modal */}
      <Modal
        open={pwModal}
        onClose={() => setPwModal(false)}
        title="Change Password"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPwModal(false)}>Cancel</Button>
            <Button onClick={() => { setPwModal(false); flash("Password changed successfully"); }}>
              Update Password
            </Button>
          </>
        }
      >
        <div className={styles.pwForm}>
          <Input type="password" label="Current password" icon={Lock} />
          <Input type="password" label="New password" icon={Lock} />
          <Input type="password" label="Confirm new password" icon={Lock} />
        </div>
      </Modal>
    </div>
  );
}
