"use client";

import { Mail, Phone, Check, Clock, Plus } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import Badge from "./Badge";
import { useApp } from "../context/AppContext";
import styles from "./VerifyContactModal.module.css";

// Opened by the "Complete" button on the profile bar.
//
// The email shown is the real one from the session — this modal is about the
// reader's own contact details, so inventing them would defeat the point. The
// phone genuinely is not held: this system collects an email, a username and a
// password, and nothing else.
//
// Nothing here actually verifies anything yet; the actions are stubs. It says
// so rather than showing a spinner and a green tick.
export default function VerifyContactModal({ open, onClose }) {
  const { user, showToast } = useApp();

  return (
    <Modal open={open} onClose={onClose} title="Verify your contact details">
      <div className={styles.body}>
        <p className={styles.intro}>
          Confirm how we can reach you. Both are needed before your first deposit.
        </p>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.icon}>
              <Mail size={18} />
            </span>
            <div className={styles.info}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{user?.email ?? "—"}</span>
            </div>
            <Badge variant="warning" icon={Clock}>Pending</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => showToast("Email verification is not available yet", "info")}
            >
              Verify
            </Button>
          </div>

          <div className={styles.row}>
            <span className={styles.icon}>
              <Phone size={18} />
            </span>
            <div className={styles.info}>
              <span className={styles.label}>Phone</span>
              <span className={styles.muted}>Not provided</span>
            </div>
            <Badge variant="neutral">Missing</Badge>
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={() => showToast("Adding a phone number is not available yet", "info")}
            >
              Add
            </Button>
          </div>
        </div>

        <p className={styles.note}>
          <Check size={13} /> Your details are only used to secure your account.
        </p>
      </div>
    </Modal>
  );
}
