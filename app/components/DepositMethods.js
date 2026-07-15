"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bitcoin, DollarSign, ChevronRight, X, Copy } from "lucide-react";
import { useApp } from "../context/AppContext";
import { paymentChannels } from "@/lib/mockData";
import { getDepositAddresses, CRYPTO_CHANNELS, ADDRESSES_EVENT } from "@/lib/depositAddresses";
import styles from "./DepositMethods.module.css";

const CRYPTO_META = Object.fromEntries(CRYPTO_CHANNELS.map((c) => [c.id, c]));
// Only crypto channels, carrying their display meta (time / fee / limits).
const CRYPTO_LIST = paymentChannels.filter((m) => CRYPTO_META[m.id]);

function MethodIcon({ kind }) {
  const map = {
    btc: <Bitcoin size={20} />,
    eth: <span className={styles.tick}>ETH</span>,
    bnb: <span className={styles.tick}>BNB</span>,
    trx: <span className={styles.tick}>TRX</span>,
    usdt: <span className={styles.tick}>USDT</span>,
    usdc: <DollarSign size={20} />,
  };
  return <span className={styles.methodIcon}>{map[kind] ?? <DollarSign size={20} />}</span>;
}

export default function DepositMethods({ title = "Deposit", action = "Deposit" }) {
  const { user, showToast } = useApp();
  const [addresses, setAddresses] = useState({});
  const [active, setActive] = useState(null); // crypto channel id for the QR modal
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const load = () => setAddresses(getDepositAddresses());
    load();
    window.addEventListener(ADDRESSES_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(ADDRESSES_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const channel = active ? CRYPTO_META[active] : null;
  const address = active ? addresses[active] : "";

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
        <div className={styles.forRow}>
          Payment methods for
          <span className={styles.flag}>🇺🇸</span>
          <span className={styles.country}>{user.country}</span>
          <button className={styles.change} onClick={() => showToast("Select country / region")}>
            Change
          </button>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cryptocurrencies</h2>
        <div className={`${styles.grid} stagger`}>
          {CRYPTO_LIST.map((m) => (
            <button key={m.id} className={styles.method} onClick={() => setActive(m.id)}>
              <MethodIcon kind={m.kind} />
              <div className={styles.body}>
                <span className={styles.name}>{m.name}</span>
                <span className={styles.meta}>Processing time {m.time}</span>
                <span className={styles.meta}>Fee {m.fee}</span>
                <span className={styles.meta}>Limits {m.limits}</span>
              </div>
              <span className={styles.go}><ChevronRight size={18} /></span>
            </button>
          ))}
        </div>
      </section>

      {mounted && channel &&
        createPortal(
          <div className={styles.overlay} onClick={() => setActive(null)} data-no-funnel>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setActive(null)} aria-label="Close">
                <X size={18} />
              </button>
              <h3 className={styles.modalTitle}>{action} {channel.name}</h3>
              <span className={styles.modalNet}>Network · {channel.network}</span>

              <div className={styles.qrBox}>
                {address ? (
                  <img
                    className={styles.qr}
                    alt={`${channel.name} address QR`}
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(address)}`}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div className={styles.qrEmpty}>No address configured yet</div>
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
                Send only {channel.name.split(" ")[0]} via the {channel.network} network to this
                address. Sending any other asset may result in permanent loss.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
