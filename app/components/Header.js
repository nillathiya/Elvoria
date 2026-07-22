"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Globe,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  CreditCard,
  HelpCircle,
  LayoutGrid,
  CandlestickChart,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "@/lib/api";
import { whatsappHref, SUPPORT_EMAIL } from "@/lib/config";
import { LANGUAGES, getLangCode, setLangCode } from "./GoogleTranslate";
import styles from "./Header.module.css";

// Help (?) menu. Every "Tools & Services" entry here (MetaTrader, Trader's
// Calculator, Tick History, Dividends on Indices…) pointed at a mock page that
// no longer exists. Only the legal documents are real, so only they remain.
const HELP_COLUMNS = [
  [
    {
      title: "Support",
      items: [
        {
          label: "Chat on WhatsApp",
          href: whatsappHref("Hi Elvoria, I need help with my account."),
          blank: true,
        },
        { label: "Help center", href: "/pa/support_hub/help_center" },
        { label: `Email ${SUPPORT_EMAIL}`, href: `mailto:${SUPPORT_EMAIL}` },
      ],
    },
    {
      title: "Legal",
      items: [
        { label: "Client Agreement", href: "/legal/client-agreement" },
        { label: "General Business Terms", href: "/legal/general-business-terms" },
        { label: "Risk Disclosure", href: "/legal/risk-disclosure" },
        { label: "Partnership Agreement", href: "/legal/partnership-agreement" },
      ],
    },
  ],
];

function initialsOf(name) {
  return String(name || "?")
    .slice(0, 2)
    .toUpperCase();
}

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, theme, toggleTheme } = useApp();

  // The admin area reuses this header — keep its links inside /admin.
  const isAdmin = (pathname || "").startsWith("/admin");
  // user is null until /api/user/me answers, and stays null when signed out.
  const identity = isAdmin
    ? { name: "Administrator", email: "", initials: "AD" }
    : {
        name: user?.username || "Account",
        email: user?.email || "",
        initials: initialsOf(user?.username),
      };
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const langRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);
  const appsRef = useRef(null);
  const helpRef = useRef(null);

  useEffect(() => {
    setLang(getLangCode());
    const onClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (appsRef.current && !appsRef.current.contains(e.target)) setAppsOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Notifications were three hardcoded fake events ("$500.00 credited to
  // #12345678"). There is no notification source yet, so the tray shows an
  // honest empty state rather than invented activity.
  const notifications = [];

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      <div className={styles.right}>
        {/* The wallet balance shown here was a mock figure with nothing behind
            it. Balances are not part of this spec, so the link just goes to
            the deposit flow. */}
        {!isAdmin && (
          <Link href="/pa/deposit" className={styles.wallet}>
            <span className={styles.walletIcon}>
              <CreditCard size={16} />
            </span>
            <span className={styles.walletValue}>Deposit</span>
          </Link>
        )}

        {/* Theme toggle */}
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Language */}
        <div className={`${styles.dropdownWrap} ${styles.hideMobile}`} ref={langRef} translate="no">
          <button
            className={styles.iconBtn}
            onClick={() => setLangOpen((v) => !v)}
            aria-label="Language"
            title={currentLang.label}
          >
            <Globe size={19} />
          </button>
          {langOpen && (
            <div className={[styles.dropdown, styles.langMenu, "notranslate"].join(" ")}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={[styles.dropItem, l.code === lang ? styles.dropItemActive : ""]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setLangOpen(false);
                    setLangCode(l.code);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Help — Tools & Services mega-menu */}
        <div className={`${styles.dropdownWrap} ${styles.hideMobile}`} ref={helpRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setHelpOpen((v) => !v)}
            aria-label="Tools & Services"
          >
            <HelpCircle size={19} />
          </button>
          {helpOpen && (
            <div className={[styles.dropdown, styles.helpMenu].join(" ")}>
              {HELP_COLUMNS.map((col, ci) => (
                <div key={ci} className={styles.helpCol}>
                  {col.map((section) => (
                    <div key={section.title} className={styles.helpSection}>
                      <div className={styles.helpHeading}>{section.title}</div>
                      {section.items.map((it) => (
                        <Link
                          key={it.label}
                          href={it.href}
                          target={it.blank ? "_blank" : undefined}
                          rel={it.blank ? "noopener noreferrer" : undefined}
                          className={styles.helpItem}
                          onClick={() => setHelpOpen(false)}
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className={styles.dropdownWrap} ref={notifRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className={styles.notifDot} />
          </button>
          {notifOpen && (
            <div className={[styles.dropdown, styles.notifMenu].join(" ")}>
              <div className={styles.dropHeader}>
                <span>Notifications</span>
                <span className={styles.badgeCount}>{notifications.length}</span>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={styles.notifItem}>
                  <div className={styles.notifDotSm} />
                  <div>
                    <div className={styles.notifTitle}>{n.title}</div>
                    <div className={styles.notifDesc}>{n.desc}</div>
                    <div className={styles.notifTime}>{n.time}</div>
                  </div>
                </div>
              ))}
              <button className={styles.dropFooter}>View all</button>
            </div>
          )}
        </div>

        {/* Apps grid */}
        <div className={`${styles.dropdownWrap} ${styles.hideMobile}`} ref={appsRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setAppsOpen((v) => !v)}
            aria-label="Apps"
          >
            <LayoutGrid size={19} />
          </button>
          {appsOpen && (
            <div className={[styles.dropdown, styles.appsMenu].join(" ")}>
              <Link href="/pa" className={styles.dropItem} onClick={() => setAppsOpen(false)}>
                <LayoutGrid size={17} /> Personal area
              </Link>
            </div>
          )}
        </div>

        {/* User */}
        <div className={styles.dropdownWrap} ref={userRef}>
          <button className={styles.userBtn} onClick={() => setUserOpen((v) => !v)} aria-label="Account">
            <span className={styles.avatar}>{identity.initials}</span>
          </button>
          {userOpen && (
            <div className={[styles.dropdown, styles.userMenu].join(" ")}>
              <div className={styles.userInfo}>
                <span className={styles.avatarLg}>{identity.initials}</span>
                <div>
                  <div className={styles.userInfoName}>{identity.name}</div>
                  <div className={styles.userInfoEmail}>{identity.email}</div>
                </div>
              </div>
              {/* Only the admin has a profile page. The client-side profile
                  and settings pages rendered mock verification steps and fake
                  sessions, so they are gone. */}
              {isAdmin && (
                <Link href="/admin/profile" className={styles.dropItem} onClick={() => setUserOpen(false)}>
                  <User size={17} /> Profile
                </Link>
              )}
              <div className={styles.divider} />
              <button
                className={[styles.dropItem, styles.signOut].join(" ")}
                onClick={async () => {
                  setUserOpen(false);
                  // Sessions are server-side, so signing out means telling the
                  // server to destroy it — not flipping a flag in the browser.
                  if (isAdmin) {
                    await api.post("/api/admin/logout").catch(() => {});
                    router.replace("/admin");
                  } else {
                    await api.post("/api/user/logout").catch(() => {});
                    router.replace("/");
                  }
                  router.refresh();
                }}
              >
                <LogOut size={17} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
