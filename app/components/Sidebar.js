"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CandlestickChart,
  WalletCards,
  LineChart,
  Award,
  Copy,
  LifeBuoy,
  CircleUser,
  ChevronDown,
  Users,
  ExternalLink,
  X,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from "lucide-react";
import Logo from "./Logo";
import { useApp } from "../context/AppContext";
import styles from "./Sidebar.module.css";

// Navigation for the demo personal area.
//
// Everything under Trading renders invented data from lib/demoData — there is
// no trading engine behind any of it. Deposit and Withdrawal are the exception:
// those are wired to the real API.
const NAV = [
  {
    id: "trading",
    label: "Trading",
    icon: CandlestickChart,
    children: [
      { href: "/pa/trading/accounts", label: "Accounts" },
      { href: "/pa/analytics", label: "Performance" },
      { href: "/pa/transactions", label: "History of orders" },
      { href: "/webtrading", label: "Elvoria terminal", external: true, blank: true },
    ],
  },
  {
    id: "payments",
    label: "Payments & wallet",
    icon: WalletCards,
    children: [
      { href: "/pa/deposit", label: "Deposit" },
      { href: "/pa/withdraw", label: "Withdrawal" },
    ],
  },
];

const cx = (...c) => c.filter(Boolean).join(" ");

export default function Sidebar({ open = false, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleCollapsed } = useApp();

  const childActive = (group) =>
    group.children?.some((c) => pathname === c.href || pathname.startsWith(c.href));

  // Which accordion groups are expanded. Auto-open the one holding the route.
  const [openGroups, setOpenGroups] = useState(() => {
    const init = { trading: true };
    NAV.forEach((g) => {
      if (g.children && childActive(g)) init[g.id] = true;
    });
    return init;
  });

  const toggleGroup = (id) => setOpenGroups((s) => ({ ...s, [id]: !s[id] }));

  const handleLogout = () => {
    onClose?.();
    router.push("/");
  };

  return (
    <>
      <div className={cx(styles.backdrop, open && styles.backdropOpen)} onClick={onClose} />
      <aside className={cx(styles.sidebar, open && styles.open, collapsed && styles.collapsed)}>
        <div className={styles.brandRow}>
          <Link href="/pa" className={styles.brand} onClick={onClose}>
            {/* The rail is 76px wide — too narrow for the lockup — so CSS swaps in the
                bare emblem there. Only the visible one is fetched: browsers skip
                background images inside a display:none element. */}
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
          {NAV.map((group) => {
            const Icon = group.icon;

            // Single link (no children)
            if (!group.children) {
              const active = pathname.startsWith(group.href);
              return (
                <Link
                  key={group.id}
                  href={group.href}
                  onClick={onClose}
                  className={cx(styles.parent, active && styles.parentActive)}
                  title={collapsed ? group.label : undefined}
                >
                  <span className={styles.itemIcon}><Icon size={20} /></span>
                  <span className={styles.itemLabel}>{group.label}</span>
                </Link>
              );
            }

            // Accordion group
            const isOpen = !!openGroups[group.id];
            const parentActive = childActive(group);
            return (
              <div key={group.id} className={styles.group}>
                <button
                  className={cx(styles.parent, parentActive && styles.parentActive)}
                  onClick={() => toggleGroup(group.id)}
                  title={collapsed ? group.label : undefined}
                >
                  <span className={styles.itemIcon}><Icon size={20} /></span>
                  <span className={styles.itemLabel}>{group.label}</span>
                  <ChevronDown
                    size={16}
                    className={cx(styles.caret, isOpen && styles.caretOpen)}
                  />
                </button>

                {isOpen && (
                  <div className={styles.children}>
                    {group.children.map((c, i) => {
                      const active = pathname === c.href;
                      return (
                        <Link
                          key={`${c.href}-${i}`}
                          href={c.href}
                          onClick={onClose}
                          target={c.blank ? "_blank" : undefined}
                          rel={c.blank ? "noopener noreferrer" : undefined}
                          className={cx(styles.child, active && styles.childActive)}
                        >
                          <span>{c.label}</span>
                          {c.badge && <span className={styles.childBadge}>{c.badge}</span>}
                          {c.external && <ExternalLink size={14} className={styles.extIcon} />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={styles.itemIcon}>
              {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </span>
            <span className={styles.itemLabel}>Collapse</span>
          </button>
         
        </div>
      </aside>
    </>
  );
}
