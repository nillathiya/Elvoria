"use client";

import {
  BadgeCheck,
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
import { user, profileFields, verificationSteps } from "@/lib/mockData";
import styles from "./page.module.css";

const VERIFY_ICONS = {
  email: Mail,
  phone: Phone,
  identity: Fingerprint,
  address: Home,
};

export default function ProfilePage() {
  const { showToast } = useApp();

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
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{user.name}</h2>
            <Badge variant="warning" icon={BadgeCheck}>
              {user.tier}
            </Badge>
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
            {profileFields.map((f) => {
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
        <div className={styles.docGrid}>
          <DropZone
            title="Proof of identity"
            hint="Passport, ID card or driver's license"
            status={<Badge variant="success" icon={Check}>Verified</Badge>}
            onUpload={() => showToast("Document uploaded")}
          />
          <DropZone
            title="Proof of address"
            hint="Utility bill or bank statement (last 3 months)"
            status={<Badge variant="warning" icon={Clock}>Pending</Badge>}
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
