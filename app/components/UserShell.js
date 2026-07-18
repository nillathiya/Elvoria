"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gift, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import Button from "./Button";
import { useApp } from "../context/AppContext";
import { DEPOSIT_BONUS_TIERS, formatMoney } from "@/lib/config";
import styles from "../pa/layout.module.css";

const OFFER_DISMISS_KEY = "elvoria-hide-deposit-offer";

// Chrome only — authentication lives in the server layout that renders this.
//
// The click-capture "funnel" that used to live here is gone for good: it
// swallowed every link and button press in the panel and redirected it to the
// deposit page, so nothing else in the UI actually worked.
export default function UserShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [offerHidden, setOfferHidden] = useState(false);
  const router = useRouter();
  const { collapsed, toasts } = useApp();

  // Remember a dismissal across navigation without nagging on every page.
  useEffect(() => {
    try {
      if (localStorage.getItem(OFFER_DISMISS_KEY) === "1") setOfferHidden(true);
    } catch {}
  }, []);

  const dismissOffer = () => {
    setOfferHidden(true);
    try {
      localStorage.setItem(OFFER_DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className={styles.shell}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={[styles.main, collapsed ? styles.collapsed : ""].filter(Boolean).join(" ")}>
        <Header onMenuClick={() => setMenuOpen(true)} />

        {/* First-deposit offer bar (replaces the old complete-your-profile
            prompt). Tiers come from lib/config so this and the /pa/deposit
            calculator can never disagree. */}
        {!offerHidden && (
          <div className={styles.offerBar}>
            <div className={styles.offerInner}>
              <span className={styles.offerIcon}>
                <Gift size={20} />
              </span>
              <div className={styles.offerText}>
                <span className={styles.offerTitle}>
                  First deposit bonus — up to +50% trading balance
                </span>
                <div className={styles.offerTiers}>
                  {DEPOSIT_BONUS_TIERS.map((t) => (
                    <span key={t.minUsd} className={styles.offerTier}>
                      <span className={styles.offerTierAmt}>{formatMoney(t.minUsd)}+</span>
                      <span className={styles.offerTierPct}>+{t.pct}%</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.offerActions}>
                <Button size="sm" onClick={() => router.push("/pa/deposit")}>
                  Deposit now
                </Button>
              </div>
              <button
                className={styles.offerClose}
                onClick={dismissOffer}
                aria-label="Dismiss offer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

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
