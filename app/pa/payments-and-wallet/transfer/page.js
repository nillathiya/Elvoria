"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import { useApp } from "@/app/context/AppContext";
import { currencies } from "@/lib/demoData";
import { formatMoney } from "@/lib/config";
import styles from "./page.module.css";

const quickPercents = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "Max", value: 1 },
];

export default function TransferPage() {
  const { accounts, showToast } = useApp();
  const transferable = accounts.filter((a) => a.mode !== "Archived");

  const [from, setFrom] = useState(transferable[0]?.id);
  const [to, setTo] = useState(transferable[1]?.id ?? transferable[0]?.id);
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const fromAccount = accounts.find((a) => a.id === from);
  const toAccount = accounts.find((a) => a.id === to);
  const available = fromAccount?.balance ?? 0;
  const numericAmount = parseFloat(amount) || 0;

  const sameAccount = from === to;
  const exceeds = numericAmount > available;
  const belowMin = numericAmount > 0 && numericAmount < 1;
  const invalid = sameAccount || exceeds || belowMin || numericAmount < 1;

  const accountOptions = useMemo(
    () =>
      transferable.map((a) => ({
        value: a.id,
        label: `#${a.id} · ${a.type} · ${formatMoney(a.balance, a.currency)}`,
      })),
    [transferable]
  );

  const swap = () => {
    setFrom(to);
    setTo(from);
    showToast("Accounts swapped");
  };

  const handleTransfer = () => {
    if (sameAccount) return showToast("Choose two different accounts", "error");
    if (numericAmount < 1) return showToast("Minimum transfer is 1.00", "error");
    if (exceeds) return showToast("Amount exceeds available balance", "error");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast(`Transferred ${formatMoney(numericAmount, currency)} to #${to}`);
      setAmount("");
    }, 900);
  };

  // A transfer needs two accounts to move funds between. With none, `from` and
  // `to` were undefined and the summary rendered "#undefined" — the form was
  // offering a transfer that could not exist.
  if (transferable.length < 2) {
    return (
      <div className={`${styles.page} animate-in`}>
        <header className={styles.head}>
          <div>
            <h1 className={styles.title}>Transfer</h1>
            <p className={styles.sub}>Move funds between your accounts instantly</p>
          </div>
        </header>

        <Card>
          <p className={styles.emptyNote}>
            You need at least two accounts to transfer between them.{" "}
            <Link href="/pa/trading/accounts">Open an account</Link> to get started.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Transfer</h1>
          <p className={styles.sub}>Move funds between your accounts instantly</p>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.left}>
          <Card className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Transfer Details</h2>

            <div className={styles.transferRow}>
              <Input
                type="select"
                label="From"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                options={accountOptions}
              />

              <button
                type="button"
                className={styles.swapBtn}
                onClick={swap}
                aria-label="Swap accounts"
                title="Swap accounts"
              >
                <ArrowUpDown size={18} />
              </button>

              <Input
                type="select"
                label="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                error={sameAccount ? "From and To must differ" : null}
                options={accountOptions}
              />
            </div>

            <div className={styles.amountRow}>
              <Input
                type="number"
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={
                  exceeds
                    ? "Exceeds available balance"
                    : belowMin
                    ? "Minimum transfer is 1.00"
                    : null
                }
                helper={
                  exceeds || belowMin
                    ? null
                    : `Available: ${formatMoney(available, fromAccount?.currency ?? currency)}`
                }
                min="0"
              />
              <div className={styles.currencyWrap}>
                <Input
                  type="select"
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={currencies}
                />
              </div>
            </div>

            <div className={styles.quick}>
              {quickPercents.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => setAmount((available * q.value).toFixed(2))}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <aside className={styles.right}>
          <Card variant="glass" className={styles.summary}>
            <h2 className={styles.sectionTitle}>Summary</h2>
            <div className={styles.summaryRows}>
              <Row label="From" value={`#${from}`} />
              <Row label="To" value={`#${to}`} />
              <Row label="Amount" value={formatMoney(numericAmount, currency)} />
              <Row label="Fee" value="Free" positive />
              <div className={styles.summaryDivider} />
              <Row
                label="You transfer"
                value={formatMoney(numericAmount, currency)}
                strong
              />
            </div>

            <div className={styles.route}>
              <span className={styles.routeNode}>#{from}</span>
              <ArrowRight size={16} className={styles.routeArrow} />
              <span className={styles.routeNode}>#{to}</span>
            </div>

            <Button
              size="lg"
              fullWidth
              loading={loading}
              disabled={invalid}
              onClick={handleTransfer}
              className={styles.cta}
            >
              Transfer now
            </Button>

            <p className={styles.secureNote}>
              <Zap size={13} style={{ verticalAlign: "-2px" }} /> Instant
              <span className={styles.dotSep}>·</span>
              <ShieldCheck size={13} style={{ verticalAlign: "-2px" }} /> Free
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false, positive = false }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span
        className={strong ? styles.rowStrong : styles.rowValue}
        style={positive ? { color: "var(--success)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
