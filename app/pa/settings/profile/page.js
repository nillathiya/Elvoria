"use client";

import {
  Mail,
  Phone,
  Fingerprint,
  Home,
  Lock,
  Check,
  Clock,
  Upload,
  Plus,
} from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import { useApp } from "@/app/context/AppContext";
import { user as demoUser, profileFields, verificationSteps } from "@/lib/demoData";
import styles from "./page.module.css";

const VERIFY_ICONS = {
  email: Mail,
  phone: Phone,
  identity: Fingerprint,
  address: Home,
};

export default function ProfilePage() {
  const { showToast, user: sessionUser } = useApp();

  // This page shows you your own identity, so the parts we actually know come
  // from the session. Only the fields this system has no concept of — phone,
  // date of birth, tier, client id — fall back to the demo record. Rendering
  // "John Doe" to someone signed in as demouser would just be wrong.
  const user = {
    ...demoUser,
    name: sessionUser?.username ?? demoUser.name,
    email: sessionUser?.email ?? demoUser.email,
    initials: (sessionUser?.username ?? demoUser.name).slice(0, 2).toUpperCase(),
    // The account id and join date are real — they were showing a stranger's
    // client number and a 2023 join date to someone who signed up today.
    clientId: sessionUser?.id ?? demoUser.clientId,
    memberSince: sessionUser?.createdAt
      ? new Date(sessionUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : demoUser.memberSince,
  };

  // The details table is driven by its own list, so it needs the same
  // treatment — otherwise the header greets demouser while the table below
  // calls them John Doe, on the page whose whole job is showing your identity.
  const fields = profileFields.map((f) => {
    if (f.key === "name") return { ...f, value: user.name };
    if (f.key === "email") return { ...f, value: user.email };
    return f;
  });

  const verifiedCount = verificationSteps.filter(
    (s) => s.status === "Verified"
  ).length;
  const progress = Math.round((verifiedCount / verificationSteps.length) * 100);

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Profile &amp; verification</h1>
          <p className={styles.sub}>
            Manage your personal details and verification status
          </p>
        </div>
      </header>

      {/* Profile summary */}
      <Card variant="glass" className={styles.summary}>
        <div className={styles.avatar}>{user.initials}</div>
        <div className={styles.summaryInfo}>
          {/* The "Gold" badge was awarded by nobody: there is no tier system,
              no criteria and nothing that could change it. */}
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{user.name}</h2>
          </div>
          <p className={styles.email}>{user.email}</p>
          <div className={styles.metaRow}>
            <span className={styles.idChip}>ID {user.clientId}</span>
            <span className={styles.memberSince}>
              Member since {user.memberSince}
            </span>
          </div>
        </div>
      </Card>

      <div className={styles.grid}>
        {/* Verification progress */}
        <Card className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Verification</h3>
            <span className={styles.progressLabel}>
              {verifiedCount}/{verificationSteps.length} complete
            </span>
          </div>
          <div className={styles.progressTrack}>
            <span
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.verifyList}>
            {verificationSteps.map((v) => {
              const Icon = VERIFY_ICONS[v.key];
              const done = v.status === "Verified";
              return (
                <div key={v.key} className={styles.verifyRow}>
                  <span className={styles.verifyIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.verifyLabel}>{v.label}</span>
                  <Badge
                    variant={done ? "success" : "warning"}
                    icon={done ? Check : Clock}
                  >
                    {v.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Personal details */}
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal details</h3>
          <div className={styles.detailList}>
            {fields.map((f) => {
              const notProvided = f.value === "Not provided";
              return (
                <div key={f.key} className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    {f.label}
                    {f.editable === false && (
                      <Lock size={12} className={styles.lock} />
                    )}
                  </span>
                  <div className={styles.detailValue}>
                    {notProvided ? (
                      <>
                        <span className={styles.muted}>Not provided</span>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Plus}
                          onClick={() => showToast(`Add ${f.label.toLowerCase()}`)}
                        >
                          Add
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className={styles.value}>{f.value}</span>
                        {f.verified && (
                          <Badge variant="success" icon={Check}>
                            Verified
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Documents */}
      <Card className={styles.section}>
        <h3 className={styles.sectionTitle}>Documents</h3>
        <p className={styles.sectionSub}>
          Upload clear, valid and unexpired documents to complete verification.
        </p>
        {/* These badges were hardcoded to Verified and Pending while the
            checklist above says 0/4 — the same page contradicting itself about
            whether the user had submitted anything. */}
        <div className={styles.docGrid}>
          <DropZone
            title="Proof of identity"
            hint="Passport, ID card or driver's license"
            status={<Badge variant="neutral">Not uploaded</Badge>}
            onUpload={() => showToast("Document uploaded")}
          />
          <DropZone
            title="Proof of address"
            hint="Utility bill or bank statement (last 3 months)"
            status={<Badge variant="neutral">Not uploaded</Badge>}
            onUpload={() => showToast("Document uploaded")}
          />
        </div>
      </Card>
    </div>
  );
}

function DropZone({ title, hint, status, onUpload }) {
  return (
    <div className={styles.dropZone}>
      <div className={styles.dropHead}>
        <span className={styles.dropTitle}>{title}</span>
        {status}
      </div>
      <div className={styles.dropIcon}>
        <Upload size={22} />
      </div>
      <p className={styles.dropHint}>{hint}</p>
      <Button size="sm" variant="outline" icon={Upload} onClick={onUpload}>
        Upload
      </Button>
    </div>
  );
}
