"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  wallet as demoWallet,
  accounts as demoAccounts,
  transactions as demoTransactions,
} from "@/lib/demoData";

const AppContext = createContext(null);

// Two kinds of state live here, and they are deliberately not mixed:
//
//   user            REAL. Read from /api/user/me — an actual session.
//   wallet/accounts/transactions
//                   DEMO. Invented numbers from lib/demoData for the trading
//                   pages to render. Nothing is behind them: they reset on
//                   reload and no server has ever heard of them.
//
// The deposit flow does not read any of this — it goes to the API and verifies
// against the blockchain.
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

  // ---- Demo trading state ----
  //
  // In memory only, on purpose. Persisting it would make invented balances look
  // durable, and the next reader would have to work out whether they were real.
  const [wallet, setWallet] = useState(demoWallet);
  const [accounts, setAccounts] = useState(demoAccounts);
  const [transactions, setTransactions] = useState(demoTransactions);

  const addAccount = useCallback((partial) => {
    const id = String(Math.floor(10000000 + Math.random() * 89999999));
    const account = {
      id,
      equity: partial.mode === "Demo" ? 10000 : 0,
      balance: partial.mode === "Demo" ? 10000 : 0,
      server: partial.mode === "Demo" ? "Demo-3" : "Real-15",
      created: "Jul 2025",
      ...partial,
    };
    setAccounts((prev) => [account, ...prev]);
    return account;
  }, []);

  const archiveAccount = useCallback((id) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, mode: "Archived", balance: 0, equity: 0 } : a))
    );
  }, []);

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [
      { id: `TX${10022 + prev.length}`, date: "Jul 13, 2025", rawDate: "2025-07-13", status: "Pending", ...tx },
      ...prev,
    ]);
  }, []);

  // Sum of the demo "Real" account balances, shown in the header.
  const totalRealBalance = useMemo(
    () => accounts.filter((a) => a.mode === "Real").reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

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
      // real
      user,
      userLoading,
      setUser,
      // demo
      wallet,
      accounts,
      transactions,
      totalRealBalance,
      addAccount,
      archiveAccount,
      addTransaction,
      // ui
      toasts,
      showToast,
    }),
    [
      theme,
      toggleTheme,
      collapsed,
      toggleCollapsed,
      user,
      userLoading,
      wallet,
      accounts,
      transactions,
      totalRealBalance,
      addAccount,
      archiveAccount,
      addTransaction,
      toasts,
      showToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
