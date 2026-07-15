"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const AppContext = createContext(null);

// UI state plus the signed-in user. Everything this context used to hold — a
// seeded user, a wallet, trading accounts, a transaction list and the
// deposit/withdraw mutations that moved fake balances around — was mock data
// with no server behind it, so it is gone rather than reimplemented.
export function AppProvider({ children }) {
  // ---- Theme ----
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("elvoria-theme") || window.localStorage.getItem("dash-theme")
        : null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("elvoria-theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  // ---- Sidebar collapse (desktop) ----
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  // ---- Session ----
  //
  // Read from the server rather than assumed. This is display only: the page
  // itself is protected by the server-side guard, so a null user here means
  // "not signed in", not "access granted".
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/user/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, tone = "success") => {
    const id = `${message}-${Math.round(performance.now())}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      collapsed,
      toggleCollapsed,
      user,
      userLoading,
      setUser,
      toasts,
      showToast,
    }),
    [theme, toggleTheme, collapsed, toggleCollapsed, user, userLoading, toasts, showToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
