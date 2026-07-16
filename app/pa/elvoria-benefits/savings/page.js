"use client";

import { useState, useMemo } from "react";
import { Sparkles, Wallet, TrendingUp, CircleDollarSign, Coins } from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import { useApp } from "@/app/context/AppContext";
import { savings } from "@/lib/demoData";
import { formatMoney } from "@/lib/config";
import styles from "./page.module.css";

export default function SavingsPage() {
  const { showToast } = useApp();
  const [amount, setAmount] = useState(String(savings.freeFunds));

  const numericAmount = parseFloat(amount) || 0;

  const projection = useMemo(() => {
    const daily = (numericAmount * savings.apy) / 100 / 365;
    return {
      daily,
      monthly: daily * 30,
      yearly: (numericAmount * savings.apy) / 100,
    };
  }, [numericAmount]);

  const tiles = [
    { label: "Free funds", value: formatMoney(savings.freeFunds), icon: Wallet },
    { label: "Accrued this month", value: `+${formatMoney(savings.accrued)}`, icon: TrendingUp, green: true },
    { label: "Total paid out", value: `+${formatMoney(savings.paidOut)}`, icon: CircleDollarSign, green: true },
    { label: "Min balance", value: formatMoney(savings.minBalance), icon: Coins },
  ];

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Savings</h1>
          <p className={styles.sub}>Earn annual interest on your free funds</p>
        </div>
      </header>

      <Card variant="highlighted" padding="lg" className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.overlineTag}>
            <Sparkles size={14} /> Savings
          </span>
          <div className={styles.apy}>
            {savings.apy}
            <span className={styles.apyUnit}>% APY</span>
          </div>
          <p className={styles.apySub}>on available free funds, paid daily</p>
        </div>
        <div className={styles.heroRight}>
          <Button
            size="lg"
            icon={Sparkles}
            onClick={() => showToast("Savings activated", "success")}
          >
            Start earning
          </Button>
        </div>
      </Card>

      <section className={styles.tiles}>
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label} variant="glass" className={styles.tile}>
              <span className={styles.tileIcon}>
                <Icon size={18} />
              </span>
              <span className={styles.tileLabel}>{t.label}</span>
              <span className={`${styles.tileValue} ${t.green ? styles.green : ""}`}>
                {t.value}
              </span>
            </Card>
          );
        })}
      </section>

      <div className={styles.grid}>
        <Card padding="lg" className={styles.calc}>
          <h2 className={styles.sectionTitle}>Projected earnings</h2>
          <p className={styles.sectionSub}>
            Estimate your interest at the current {savings.apy}% APY.
          </p>
          <Input
            type="number"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helper="Interest accrues daily on your free funds"
            min="0"
          />
          <div className={styles.results}>
            <ResultRow label="Daily" value={formatMoney(projection.daily)} />
            <ResultRow label="Monthly" value={formatMoney(projection.monthly)} />
            <div className={styles.resultDivider} />
            <ResultRow label="Yearly" value={formatMoney(projection.yearly)} strong />
          </div>
        </Card>

        <Card padding="lg" className={styles.history}>
          <h2 className={styles.sectionTitle}>Accrual history</h2>
          <p className={styles.sectionSub}>Recent daily interest payments.</p>
          <ul className={styles.historyList}>
            {savings.history.map((h) => (
              <li key={h.date} className={styles.historyRow}>
                <span className={styles.historyDate}>{h.date}</span>
                <span className={styles.historyAmount}>
                  +{formatMoney(h.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ResultRow({ label, value, strong = false }) {
  return (
    <div className={styles.resultRow}>
      <span className={styles.resultLabel}>{label}</span>
      <span className={`${strong ? styles.resultStrong : styles.resultValue} ${styles.green}`}>
        {value}
      </span>
    </div>
  );
}
