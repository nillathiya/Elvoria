"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { useApp } from "../context/AppContext";
import styles from "../pa/layout.module.css";

// Chrome only — authentication lives in the server layout that renders this.
//
// Two things were removed from the old version:
//  - a click-capture "funnel" that swallowed every link and button press in
//    the panel and redirected it to the deposit page, so nothing else in the
//    UI actually worked;
//  - a "complete your profile" bar pointing at /pa/settings, a page that only
//    ever displayed mock verification steps.
export default function UserShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { collapsed, toasts } = useApp();

  return (
    <div className={styles.shell}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={[styles.main, collapsed ? styles.collapsed : ""].filter(Boolean).join(" ")}>
        <Header onMenuClick={() => setMenuOpen(true)} />
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
