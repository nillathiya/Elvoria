"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import styles from "./layout.module.css";

export default function PersonalAreaLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { collapsed, toasts, showToast } = useApp();

  // Funnel: any link or button clicked inside a page routes to the Deposit page.
  // The sidebar sits outside this container (keeps its own navigation) and the
  // top header (<header>) is excluded so the app stays usable.
  const funnelToDeposit = (e) => {
    if (e.target.closest("header")) return; // leave the top bar working
    if (e.target.closest("[data-no-funnel]")) return; // opt-out (e.g. deposit page)
    const el = e.target.closest("a, button");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    router.push("/pa/deposit");
  };

  return (
    <div className={styles.shell}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div
        className={[styles.main, collapsed ? styles.collapsed : ""].filter(Boolean).join(" ")}
        onClickCapture={funnelToDeposit}
      >
        <Header onMenuClick={() => setMenuOpen(true)} />

        {/* Full-width complete-your-profile bar (Exness) */}
        <div className={styles.profileBar}>
          <div className={styles.profileInner}>
            <span className={styles.profileIcon}>
              <UserRound size={20} />
            </span>
            <span className={styles.profileText}>
              Hello. Fill in your account details to make your first deposit
            </span>
            <div className={styles.profileActions}>
              <Button variant="secondary" size="sm" onClick={() => showToast("Opening guide…", "info")}>
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
