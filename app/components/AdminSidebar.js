"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wallet, CircleUser, LogOut, X, Users, Layers, Receipt } from "lucide-react";
import Logo from "./Logo";
import { api } from "@/lib/api";
import styles from "./Sidebar.module.css";

const cx = (...c) => c.filter(Boolean).join(" ");

const ITEMS = [
  { href: "/admin/peers", label: "Peers", icon: Users },
  { href: "/admin/deposit-methods", label: "Deposit methods", icon: Layers },
  { href: "/admin/deposit-address", label: "Deposit address", icon: Wallet },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/profile", label: "Profile", icon: CircleUser },
];

export default function AdminSidebar({ open = false, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    // The server deletes the session file; clearing a client flag would leave
    // the cookie working.
    await api.post("/api/admin/logout").catch(() => {});
    onClose?.();
    router.replace("/admin");
    router.refresh();
  };

  return (
    <>
      <div className={cx(styles.backdrop, open && styles.backdropOpen)} onClick={onClose} />
      <aside className={cx(styles.sidebar, open && styles.open)}>
        <div className={styles.brandRow}>
          <Link href="/admin/deposit-address" className={styles.brand} onClick={onClose}>
            <span className={styles.brandLockup}>
              <Logo size={84} />
            </span>
            <span className={styles.brandMark}>
              <Logo variant="mark" size={44} />
            </span>
          </Link>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onClose}
                className={cx(styles.parent, active && styles.parentActive)}
              >
                <span className={styles.itemIcon}><Icon size={20} /></span>
                <span className={styles.itemLabel}>{it.label}</span>
              </Link>
            );
          })}

          <button className={cx(styles.parent, styles.logout)} onClick={signOut}>
            <span className={styles.itemIcon}><LogOut size={20} /></span>
            <span className={styles.itemLabel}>Sign out</span>
          </button>
        </nav>

        <div className={styles.footer}>
          <span className={styles.itemLabel} style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-muted)" }}>
            Admin panel
          </span>
        </div>
      </aside>
    </>
  );
}
