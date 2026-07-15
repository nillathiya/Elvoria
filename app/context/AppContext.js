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
  user as seedUser,
  wallet as seedWallet,
  accounts as seedAccounts,
  transactions as seedTransactions,
} from "@/lib/mockData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ---- Theme ---- (default light to match the Exness personal-area look)
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

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  // ---- Sidebar collapse (desktop) ----
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  // ---- Data ----
  const [user] = useState(seedUser);
  const [wallet, setWallet] = useState(seedWallet);
  const [accounts, setAccounts] = useState(seedAccounts);
  const [transactions, setTransactions] = useState(seedTransactions);

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, tone = "success") => {
    const id = `${message}-${toasts.length}-${Math.round(performance.now())}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, [toasts.length]);

  // ---- Mutations ----
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
      prev.map((a) =>
        a.id === id ? { ...a, mode: "Archived", balance: 0, equity: 0 } : a
      )
    );
  }, []);

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [
      {
        id: `TX${10022 + prev.length}`,
        date: "Jul 13, 2025",
        rawDate: "2025-07-13",
        status: "Pending",
        ...tx,
      },
      ...prev,
    ]);
  }, []);

  const deposit = useCallback(
    (accountId, amount, method) => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, balance: a.balance + amount, equity: a.equity + amount }
            : a
        )
      );
      addTransaction({ type: "Deposit", account: accountId, amount, method });
    },
    [addTransaction]
  );

  const withdraw = useCallback(
    (accountId, amount, method) => {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, balance: a.balance - amount, equity: a.equity - amount }
            : a
        )
      );
      addTransaction({ type: "Withdraw", account: accountId, amount: -amount, method });
    },
    [addTransaction]
  );

  // Wallet balance = liquid funds hub + sum of real trading balances (shown in header).
  const totalRealBalance = useMemo(
    () =>
      accounts
        .filter((a) => a.mode === "Real")
        .reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      collapsed,
      toggleCollapsed,
      user,
      wallet,
      accounts,
      transactions,
      totalRealBalance,
      toasts,
      showToast,
      addAccount,
      archiveAccount,
      addTransaction,
      deposit,
      withdraw,
    }),
    [
      theme,
      toggleTheme,
      collapsed,
      toggleCollapsed,
      user,
      wallet,
      accounts,
      transactions,
      totalRealBalance,
      toasts,
      showToast,
      addAccount,
      archiveAccount,
      addTransaction,
      deposit,
      withdraw,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
