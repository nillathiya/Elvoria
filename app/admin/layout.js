"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminSidebar from "../components/AdminSidebar";
import { useApp } from "../context/AppContext";
import { isAdminAuthed } from "@/lib/adminConfig";
import styles from "../pa/layout.module.css";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toasts } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const isLogin = pathname === "/admin";

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!isAdminAuthed()) {
      router.replace("/admin");
      return;
    }
    setReady(true);
  }, [pathname, isLogin, router]);

  return (
    <>
      {isLogin ? (
        children
      ) : !ready ? null : (
        <div className={styles.shell}>
          <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className={styles.main}>
            <Header onMenuClick={() => setMenuOpen(true)} />
            <div className={styles.content}>
              {children}
              <Footer />
            </div>
          </div>
        </div>
      )}

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
