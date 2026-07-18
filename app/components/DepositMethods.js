"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bitcoin, DollarSign, ChevronRight, X, Copy, Gift, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "@/lib/api";
import {
  MIN_DEPOSIT_USD,
  DEPOSIT_BONUS_TIERS,
  bonusPctForUsd,
  COINGECKO_IDS,
  STABLE_SYMBOLS,
  cryptoDecimals,
  formatMoney,
} from "@/lib/config";
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

// Live USD price for a symbol. Stablecoins are pinned to $1 by definition and
// never queried; everything else comes from the CoinGecko snapshot.
function priceForSymbol(symbol, prices) {
  if (STABLE_SYMBOLS.includes(symbol)) return 1;
  const p = prices[symbol];
  return Number.isFinite(p) ? p : null;
}

function fmtAmt(value, symbol) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: cryptoDecimals(symbol),
  });
}

export default function DepositMethods({ title = "Deposit", action = "Deposit", mode = "deposit" }) {
  const { showToast } = useApp();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deposit, setDeposit] = useState(null); // the open request + its address
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Live market prices (BTC/ETH/BNB/TRX) and the amount the user wants to
  // deposit, in USD. Everything on the page — the per-coin minimum and the
  // bonus — is derived from these two, so it all reacts as they change.
  const [prices, setPrices] = useState({});
  const [pricesError, setPricesError] = useState(false);
  const [amountUsd, setAmountUsd] = useState(String(MIN_DEPOSIT_USD));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    api
      .get("/api/user/deposit-methods")
      .then((d) => setMethods(d.methods))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const loadPrices = useCallback(async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const next = {};
      for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
        const p = json[id]?.usd;
        if (Number.isFinite(p)) next[sym] = p;
      }
      setPrices(next);
      setPricesError(false);
    } catch {
      setPricesError(true);
    }
  }, []);

  // Prices move intraday, so refresh them; the per-coin minimums and the crypto
  // amount to send follow along on their own.
  useEffect(() => {
    loadPrices();
    const id = setInterval(loadPrices, 60_000);
    return () => clearInterval(id);
  }, [loadPrices]);

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

  // ---- Bonus maths (pure display; nothing is persisted) ----
  const usd = Math.max(0, Number(amountUsd) || 0);
  const belowMin = usd > 0 && usd < MIN_DEPOSIT_USD;
  const bonusPct = bonusPctForUsd(usd);
  const bonusUsd = (usd * bonusPct) / 100;
  const totalUsd = usd + bonusUsd;

  const setAmount = (e) => {
    // Digits and a single decimal point only.
    const clean = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    setAmountUsd(clean);
  };

  const isDeposit = mode === "deposit";

  // The coin selected in the modal, priced for the send box.
  const modalSymbol = deposit?.method?.symbol;
  const modalPrice = modalSymbol ? priceForSymbol(modalSymbol, prices) : null;
  const modalSend = modalPrice ? usd / modalPrice : null;
  const modalMin = modalPrice ? MIN_DEPOSIT_USD / modalPrice : null;

  return (
    <div className={`${styles.page} animate-in`} data-no-funnel>
      <header>
        <h1 className={styles.title}>{title}</h1>
      </header>

      {/* ---------- First-deposit bonus calculator ---------- */}
      {isDeposit && (
        <section className={styles.calc}>
          <div className={styles.calcHead}>
            <span className={styles.calcIcon}>
              <Gift size={18} />
            </span>
            <div>
              <h2 className={styles.calcTitle}>First-deposit bonus</h2>
              <p className={styles.calcSub}>
                Add a bonus of up to +50% to your trading balance. Enter an amount to see yours.
              </p>
            </div>
          </div>

          <label className={styles.calcField}>
            <span className={styles.calcLabel}>Deposit amount (USD)</span>
            <div className={styles.calcInputWrap}>
              <span className={styles.calcCurrency}>$</span>
              <input
                className={styles.calcInput}
                inputMode="decimal"
                value={amountUsd}
                onChange={setAmount}
                placeholder={String(MIN_DEPOSIT_USD)}
                aria-label="Deposit amount in US dollars"
              />
            </div>
          </label>

          <div className={styles.chips}>
            {DEPOSIT_BONUS_TIERS.map((t) => (
              <button
                key={t.minUsd}
                type="button"
                className={`${styles.chip} ${usd >= t.minUsd ? styles.chipActive : ""}`}
                onClick={() => setAmountUsd(String(t.minUsd))}
              >
                {formatMoney(t.minUsd)} <span className={styles.chipPct}>+{t.pct}%</span>
              </button>
            ))}
          </div>

          {belowMin ? (
            <p className={styles.calcWarn}>
              Minimum first deposit is {formatMoney(MIN_DEPOSIT_USD)} to qualify for a bonus.
            </p>
          ) : (
            <div className={styles.calcResult}>
              <div className={styles.calcCell}>
                <span className={styles.calcCellLabel}>Your deposit</span>
                <span className={styles.calcCellValue}>{formatMoney(usd)}</span>
              </div>
              <div className={styles.calcCell}>
                <span className={styles.calcCellLabel}>Bonus</span>
                <span className={`${styles.calcCellValue} ${styles.bonusValue}`}>
                  <Sparkles size={14} /> +{bonusPct}% · {formatMoney(bonusUsd)}
                </span>
              </div>
              <div className={`${styles.calcCell} ${styles.calcTotal}`}>
                <span className={styles.calcCellLabel}>Trading balance</span>
                <span className={styles.calcCellValue}>{formatMoney(totalUsd)}</span>
              </div>
            </div>
          )}

          <p className={styles.calcNote}>
            Bonus is credited as trading balance on your first verified deposit. Amounts are an
            estimate based on live market prices.
          </p>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cryptocurrencies</h2>
        {isDeposit && (
          <p className={styles.note}>
            Minimum {formatMoney(MIN_DEPOSIT_USD)} in any coin — the crypto amount updates with the
            live market price.
            {pricesError ? " Live prices are temporarily unavailable." : ""}
          </p>
        )}

        {loading ? (
          <p className={styles.note}>Loading methods…</p>
        ) : !methods.length ? (
          <p className={styles.note}>No deposit methods are available right now.</p>
        ) : (
          <div className={`${styles.grid} stagger`}>
            {methods.map((m) => {
              const price = priceForSymbol(m.symbol, prices);
              const minCrypto = price ? MIN_DEPOSIT_USD / price : null;
              const sendCrypto = price ? usd / price : null;
              return (
                <button
                  key={m.id}
                  className={styles.method}
                  disabled={busy}
                  onClick={() => open(m)}
                >
                  <MethodIcon symbol={m.symbol} />
                  <div className={styles.body}>
                    <span className={styles.name}>{m.displayName}</span>
                    <span className={styles.meta}>
                      Network {m.network} · {m.requiredConfirmations} confirmations
                    </span>
                    {isDeposit && price ? (
                      <>
                        <span className={styles.metaStrong}>
                          Min ≈ {fmtAmt(minCrypto, m.symbol)} {m.symbol}
                          <span className={styles.metaMuted}> ({formatMoney(MIN_DEPOSIT_USD)})</span>
                        </span>
                        {usd >= MIN_DEPOSIT_USD && (
                          <span className={styles.meta}>
                            {formatMoney(usd)} ≈ {fmtAmt(sendCrypto, m.symbol)} {m.symbol}
                          </span>
                        )}
                        <span className={styles.metaMuted}>
                          1 {m.symbol} ≈ {formatMoney(price)}
                        </span>
                      </>
                    ) : (
                      isDeposit && (
                        <span className={styles.metaStrong}>
                          Minimum {formatMoney(MIN_DEPOSIT_USD)}
                        </span>
                      )
                    )}
                  </div>
                  <span className={styles.go}><ChevronRight size={18} /></span>
                </button>
              );
            })}
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

              {isDeposit && (
                <div className={styles.sendBox}>
                  <span className={styles.sendLabel}>Send this amount</span>
                  <span className={styles.sendAmount}>
                    {modalSend ? `${fmtAmt(modalSend, modalSymbol)} ${modalSymbol}` : formatMoney(usd)}
                  </span>
                  <span className={styles.sendSub}>
                    ≈ {formatMoney(usd)}
                    {modalMin ? ` · min ${fmtAmt(modalMin, modalSymbol)} ${modalSymbol}` : ` · min ${formatMoney(MIN_DEPOSIT_USD)}`}
                  </span>
                  {usd >= MIN_DEPOSIT_USD && bonusPct > 0 && (
                    <span className={styles.sendBonus}>
                      <Sparkles size={13} /> +{bonusPct}% bonus → {formatMoney(totalUsd)} trading balance
                    </span>
                  )}
                </div>
              )}

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
