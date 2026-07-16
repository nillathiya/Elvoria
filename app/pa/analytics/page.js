"use client";

import { useState } from "react";
import { Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import CountUp from "@/app/components/CountUp";
import { useApp } from "@/app/context/AppContext";
import { ordersSummary, analytics, closedOrders, formatMoney } from "@/lib/demoData";
import styles from "./page.module.css";

const PERIODS = ["Today", "1W", "1M", "3M", "All"];

export default function OrderSummaryPage() {
  const { accounts, showToast } = useApp();
  const realAccounts = accounts.filter((a) => a.mode === "Real");
  const [account, setAccount] = useState("all");
  const [period, setPeriod] = useState("1M");

  const { totals, breakdown, operations, direction } = ordersSummary;

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Order Summary</h1>
          <p className={styles.sub}>Aggregated results across your trading accounts</p>
        </div>
        <div className={styles.headActions}>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              aria-label="Account"
            >
              <option value="all">All real accounts</option>
              {realAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} · {a.type} · {a.platform}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" icon={Download} onClick={() => showToast("Report exported")}>
            Export
          </Button>
        </div>
      </header>

      {/* Period tabs */}
      <div className={styles.periodTabs}>
        {PERIODS.map((p) => (
          <button
            key={p}
            className={[styles.periodTab, period === p ? styles.periodActive : ""].filter(Boolean).join(" ")}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Headline tiles */}
      <section className={`${styles.tiles} stagger`}>
        {totals.map((t) => (
          <Card key={t.key} variant="glass" hoverable className={styles.tile}>
            <span className="overline">{t.label}</span>
            <div className={[styles.tileValue, t.positive ? styles.pos : ""].filter(Boolean).join(" ")}>
              {t.money ? (
                <CountUp value={t.value} prefix="$" decimals={2} />
              ) : (
                <CountUp value={t.value} decimals={t.suffix ? 1 : 0} suffix={t.suffix || ""} />
              )}
            </div>
          </Card>
        ))}
      </section>

      {/* Trading results chart */}
      <Card className={styles.chartCard}>
        <div className={styles.chartHead}>
          <div>
            <h2 className={styles.sectionTitle}>Trading results</h2>
            <p className={styles.chartSub}>Cumulative balance</p>
          </div>
          <span className={styles.periodPill}>{period}</span>
        </div>
        <EquityChart data={analytics.equityCurve} />
      </Card>

      <div className={styles.grid}>
        {/* Profit / Loss breakdown */}
        <Card className={styles.panel}>
          <h2 className={styles.sectionTitle}>Profit / Loss breakdown</h2>
          <p className={styles.chartSub}>{closedOrders.length} recent closed orders sampled</p>

          <SplitBar profit={breakdown.profitTrades} loss={breakdown.lossTrades} />

          <div className={styles.statRows}>
            <StatRow label="Gross profit" value={formatMoney(breakdown.grossProfit)} tone="pos" />
            <StatRow label="Gross loss" value={formatMoney(breakdown.grossLoss)} tone="neg" />
            <StatRow label="Profit factor" value={breakdown.profitFactor.toFixed(2)} />
            <StatRow label="Avg win" value={formatMoney(breakdown.avgWin)} tone="pos" />
            <StatRow label="Avg loss" value={formatMoney(breakdown.avgLoss)} tone="neg" />
            <StatRow label="Largest win" value={formatMoney(breakdown.largestWin)} tone="pos" />
            <StatRow label="Largest loss" value={formatMoney(breakdown.largestLoss)} tone="neg" />
            <StatRow label="Best symbol" value={breakdown.bestSymbol} />
          </div>
        </Card>

        {/* Balance operations */}
        <Card className={styles.panel}>
          <h2 className={styles.sectionTitle}>Balance operations</h2>
          <p className={styles.chartSub}>Deposits, withdrawals & fees</p>

          <div className={styles.statRows}>
            {operations.map((op) => (
              <StatRow
                key={op.key}
                label={op.label}
                value={formatMoney(op.value)}
                tone={op.value >= 0 ? "pos" : "neg"}
              />
            ))}
          </div>

          <div className={styles.direction}>
            <div className={styles.directionHead}>
              <span className="overline">Buy / Sell distribution</span>
            </div>
            <div className={styles.dirBar}>
              <span className={styles.dirBuy} style={{ width: `${direction.buy}%` }} />
              <span className={styles.dirSell} style={{ width: `${direction.sell}%` }} />
            </div>
            <div className={styles.dirLegend}>
              <span className={styles.legendItem}>
                <span className={[styles.legendDot, styles.dotBuy].join(" ")} />
                <ArrowUpRight size={14} /> Buy
                <strong>{direction.buy}%</strong>
              </span>
              <span className={styles.legendItem}>
                <span className={[styles.legendDot, styles.dotSell].join(" ")} />
                <ArrowDownRight size={14} /> Sell
                <strong>{direction.sell}%</strong>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={[styles.statValue, tone === "pos" ? styles.pos : tone === "neg" ? styles.neg : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function SplitBar({ profit, loss }) {
  const total = profit + loss || 1;
  const profitPct = (profit / total) * 100;
  const lossPct = (loss / total) * 100;
  return (
    <div className={styles.split}>
      <div className={styles.splitBar}>
        <span className={styles.splitProfit} style={{ width: `${profitPct}%` }}>
          {Math.round(profitPct)}%
        </span>
        <span className={styles.splitLoss} style={{ width: `${lossPct}%` }}>
          {Math.round(lossPct)}%
        </span>
      </div>
      <div className={styles.splitLegend}>
        <span className={styles.legendItem}>
          <span className={[styles.legendDot, styles.dotBuy].join(" ")} />
          Profit trades <strong>{profit}</strong>
        </span>
        <span className={styles.legendItem}>
          <span className={[styles.legendDot, styles.dotSell].join(" ")} />
          Loss trades <strong>{loss}</strong>
        </span>
      </div>
    </div>
  );
}

/* ---- SVG area/line chart ---- */
function EquityChart({ data }) {
  const W = 720;
  const H = 240;
  const padX = 8;
  const padY = 24;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i) => padX + (i * (W - padX * 2)) / (data.length - 1);
  const y = (v) => padY + (1 - (v - min) / span) * (H - padY * 2);

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPath = `M ${x(0)},${H - padY} L ${data.map((d, i) => `${x(i)},${y(d.value)}`).join(" L ")} L ${x(data.length - 1)},${H - padY} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={styles.chartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} preserveAspectRatio="none" role="img" aria-label="Trading results">
        <defs>
          <linearGradient id="summaryFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={padY + g * (H - padY * 2)}
            y2={padY + g * (H - padY * 2)}
            className={styles.gridLine}
          />
        ))}
        <path d={areaPath} fill="url(#summaryFill)" />
        <polyline points={linePts} fill="none" className={styles.line} />
      </svg>
      <div className={styles.axisX}>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
