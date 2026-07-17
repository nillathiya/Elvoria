"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import Button from "./Button";
import { useApp } from "../context/AppContext";
import styles from "../pa/layout.module.css";

// Chrome only — authentication lives in the server layout that renders this.
//
// The click-capture "funnel" that used to live here is gone for good: it
// swallowed every link and button press in the panel and redirected it to the
// deposit page, so nothing else in the UI actually worked.
export default function UserShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { collapsed, toasts } = useApp();

  return (
    <div className={styles.shell}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={[styles.main, collapsed ? styles.collapsed : ""].filter(Boolean).join(" ")}>
        <Header onMenuClick={() => setMenuOpen(true)} />

        {/* Complete-your-profile bar. It was pulled when /pa/settings did not
            exist; that page is back and now honestly reports 0/4 verified, so
            "Complete" leads somewhere that agrees with the prompt. */}
        <div className={styles.profileBar}>
          <div className={styles.profileInner}>
            <span className={styles.profileIcon}>
              <UserRound size={20} />
            </span>
            <span className={styles.profileText}>
              Hello. Fill in your account details to make your first deposit
            </span>
            <div className={styles.profileActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/pa/settings/profile")}
              >
                Learn more
              </Button>
              <Button size="sm" onClick={() => router.push("/pa/settings")}>
                Complete
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {children}
          <Footer />
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="toast-container" translate="no">
          {toasts.map((t) => (
            <div key={t.id} className={["toast", t.tone].filter(Boolean).join(" ")}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
