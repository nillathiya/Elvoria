"use client";

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import AdminSidebar from "./AdminSidebar";
import { useApp } from "../context/AppContext";
import styles from "../pa/layout.module.css";

// Chrome only. Authentication is handled by the server layout that renders
// this — there is deliberately no auth check here, because a client-side one
// can be bypassed by anyone with devtools.
export default function AdminShell({ children }) {
  const { toasts } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className={styles.shell}>
        <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className={styles.main}>
          <Header onMenuClick={() => setMenuOpen(true)} />
          <div className={styles.content}>
            {children}
            {/* Copyright only — the deposit disclaimers are aimed at someone
                sending funds, not at the operator configuring where they land. */}
            <Footer minimal />
          </div>
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
    </>
  );
}
