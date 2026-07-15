"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bitcoin, DollarSign, ChevronRight, X, Copy } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "@/lib/api";
import styles from "./DepositMethods.module.css";

// Icon is picked from the method's symbol, which comes from the admin's
// configuration rather than a hardcoded channel list.
function MethodIcon({ symbol }) {
  const map = {
    BTC: <Bitcoin size={20} />,
    ETH: <span className={styles.tick}>ETH</span>,
    BNB: <span className={styles.tick}>BNB</span>,
    TRX: <span className={styles.tick}>TRX</span>,
    USDT: <span className={styles.tick}>USDT</span>,
    USDC: <DollarSign size={20} />,
  };
  return <span className={styles.methodIcon}>{map[symbol] ?? <DollarSign size={20} />}</span>;
}

export default function DepositMethods({ title = "Deposit", action = "Deposit", mode = "deposit" }) {
  const { showToast } = useApp();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deposit, setDeposit] = useState(null); // the open request + its address
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    api
      .get("/api/user/deposit-methods")
      .then((d) => setMethods(d.methods))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  // Spec §9: the SERVER picks the address and pins it to a deposit request.
  // The client sends only a method id — it never chooses or supplies an
  // address, because anything it sent would be untrusted input (§26.14).
  const open = async (method) => {
    if (mode !== "deposit") {
      showToast("Withdrawals are not available yet");
      return;
    }

    setBusy(true);
    try {
      const { deposit: created } = await api.post("/api/user/deposits/create", {
        methodId: method.id,
      });
      // Reopening the same method returns the same request and the same
      // address — it is not re-rolled on each view.
      setDeposit(created);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const address = deposit?.assignedAddress || "";

  const copyAddress = () => {
    try {
      navigator.clipboard?.writeText(address);
    } catch {}
    showToast("Address copied");
  };

  return (
    <div className={`${styles.page} animate-in`} data-no-funnel>
      <header>
        <h1 className={styles.title}>{title}</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cryptocurrencies</h2>

        {loading ? (
          <p className={styles.note}>Loading methods…</p>
        ) : !methods.length ? (
          <p className={styles.note}>No deposit methods are available right now.</p>
        ) : (
          <div className={`${styles.grid} stagger`}>
            {methods.map((m) => (
              <button
                key={m.id}
                className={styles.method}
                disabled={busy}
                onClick={() => open(m)}
              >
                <MethodIcon symbol={m.symbol} />
                <div className={styles.body}>
                  <span className={styles.name}>{m.displayName}</span>
                  <span className={styles.meta}>Network {m.network}</span>
                  <span className={styles.meta}>
                    Confirmations required {m.requiredConfirmations}
                  </span>
                  {m.minAmount && <span className={styles.meta}>Minimum {m.minAmount} {m.symbol}</span>}
                </div>
                <span className={styles.go}><ChevronRight size={18} /></span>
              </button>
            ))}
          </div>
        )}
      </section>

      {mounted && deposit &&
        createPortal(
          <div className={styles.overlay} onClick={() => setDeposit(null)} data-no-funnel>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setDeposit(null)} aria-label="Close">
                <X size={18} />
              </button>
              <h3 className={styles.modalTitle}>{action} {deposit.method?.displayName}</h3>
              <span className={styles.modalNet}>Network · {deposit.method?.network}</span>

              <div className={styles.qrBox}>
                {address && (
                  <img
                    className={styles.qr}
                    alt={`${deposit.method?.displayName} address QR`}
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(address)}`}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
              </div>

              <span className={styles.addrLabel}>{action} address</span>
              <div className={styles.addrRow}>
                <span className={styles.addr}>{address || "—"}</span>
                <button className={styles.copyBtn} onClick={copyAddress} disabled={!address} aria-label="Copy address">
                  <Copy size={15} />
                </button>
              </div>

              <p className={styles.modalNote}>
                Send only {deposit.method?.symbol} via the {deposit.method?.network} network to
                this address. Sending any other asset, or using another network, may result in
                permanent loss.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
