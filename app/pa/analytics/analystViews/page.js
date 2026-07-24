"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import { useApp } from "@/app/context/AppContext";
import { tradingSignals } from "@/lib/uiData";
import styles from "./page.module.css";

const FILTERS = ["All", "Buy", "Sell"];

export default function TradingSignalsPage() {
  const { showToast } = useApp();
  const [filter, setFilter] = useState("All");

  const signals =
    filter === "All"
      ? tradingSignals
      : tradingSignals.filter((s) => s.side === filter);

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Trading signals</h1>
          <p className={styles.sub}>Actionable ideas from our market analysts</p>
        </div>
      </header>

      <div className={styles.pills} role="tablist" aria-label="Filter signals by side">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={[styles.pill, filter === f ? styles.pillActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Otherwise the filters sit above blank space, which reads as broken. */}
      {!signals.length && (
        <Card>
          <p className={styles.empty}>No trading signals are available right now.</p>
        </Card>
      )}

      <section className={`${styles.grid} stagger`}>
        {signals.map((s) => {
          const isBuy = s.side === "Buy";
          return (
            <Card key={s.id} hoverable className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.symbol}>{s.symbol}</span>
                <Badge
                  variant={isBuy ? "success" : "error"}
                  icon={isBuy ? TrendingUp : TrendingDown}
                >
                  {s.side}
                </Badge>
              </div>

              <div className={styles.stars} aria-label={`Strength ${s.strength} of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    className={n <= s.strength ? styles.starOn : styles.starOff}
                    fill={n <= s.strength ? "currentColor" : "none"}
                  />
                ))}
              </div>

              <p className={styles.meta}>
                {s.timeframe} · Updated {s.updated}
              </p>

              <div className={styles.stats}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Entry</span>
                  <span className={styles.statValue}>{s.entry}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Target</span>
                  <span className={`${styles.statValue} ${styles.pos}`}>{s.target}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Stop loss</span>
                  <span className={`${styles.statValue} ${styles.neg}`}>{s.stop}</span>
                </div>
              </div>

              <p className={styles.note}>{s.note}</p>

              <Button
                variant="outline"
                fullWidth
                onClick={() => showToast(`Opening ${s.symbol} ticket`)}
              >
                Trade
              </Button>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
