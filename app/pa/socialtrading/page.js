"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Users, Copy } from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import { useApp } from "@/app/context/AppContext";
import { copyStrategies } from "@/lib/demoData";
import styles from "./page.module.css";

const SORTS = [
  { value: "return", label: "Return" },
  { value: "copiers", label: "Copiers" },
  { value: "risk", label: "Risk" },
];

const RISK_PILLS = ["All", "Low", "Medium", "High"];
const RISK_ORDER = { Low: 1, Medium: 2, High: 3 };

function riskVariant(risk) {
  if (risk === "Low") return "success";
  if (risk === "Medium") return "warning";
  return "error";
}

export default function CopyTradingPage() {
  const { showToast } = useApp();
  const [sort, setSort] = useState("return");
  const [risk, setRisk] = useState("All");

  const stats = useMemo(() => {
    const total = copyStrategies.length;
    const avgReturn =
      copyStrategies.reduce((sum, s) => sum + s.return, 0) / total;
    const totalCopiers = copyStrategies.reduce((sum, s) => sum + s.copiers, 0);
    return { total, avgReturn, totalCopiers };
  }, []);

  const strategies = useMemo(() => {
    const filtered = copyStrategies.filter(
      (s) => risk === "All" || s.risk === risk
    );
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "copiers") return b.copiers - a.copiers;
      if (sort === "risk") return RISK_ORDER[a.risk] - RISK_ORDER[b.risk];
      return b.return - a.return;
    });
    return sorted;
  }, [sort, risk]);

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Copy Trading</h1>
          <p className={styles.sub}>
            Follow top strategies and copy their trades automatically
          </p>
        </div>
      </header>

      {/* Top stats banner */}
      <section className={`${styles.banner} stagger`}>
        <Card variant="glass" className={styles.bannerTile}>
          <span className="overline">Strategies</span>
          <div className={styles.bannerValue}>{stats.total}</div>
        </Card>
        <Card variant="glass" className={styles.bannerTile}>
          <span className="overline">Avg return</span>
          <div className={`${styles.bannerValue} text-success`}>
            +{stats.avgReturn.toFixed(1)}%
          </div>
        </Card>
        <Card variant="glass" className={styles.bannerTile}>
          <span className="overline">Total copiers</span>
          <div className={styles.bannerValue}>
            {stats.totalCopiers.toLocaleString()}
          </div>
        </Card>
      </section>

      {/* Sort / filter bar */}
      <div className={styles.controls}>
        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort strategies"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.pills}>
          {RISK_PILLS.map((p) => (
            <button
              key={p}
              className={[styles.pill, risk === p ? styles.pillActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setRisk(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy grid */}
      <section className={`${styles.grid} stagger`}>
        {strategies.map((s) => (
          <Card key={s.id} hoverable className={styles.strategy}>
            <div className={styles.stratTop}>
              <div>
                <div className={styles.stratName}>{s.name}</div>
                <div className={styles.trader}>
                  <span className={styles.flag}>{s.country}</span> {s.trader}
                </div>
              </div>
              <TrendingUp size={18} className={styles.stratIcon} />
            </div>

            <div className={styles.returnRow}>
              <div className={`${styles.return} text-success`}>
                +{s.return}%
              </div>
              <span className={styles.returnCaption}>over {s.months} mo</span>
            </div>

            <Sparkline series={s.gainSeries} />

            <div className={styles.stats}>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Risk</span>
                <Badge variant={riskVariant(s.risk)}>{s.risk}</Badge>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Copiers</span>
                <span className={styles.statValue}>
                  <Users size={13} /> {s.copiers.toLocaleString()}
                </span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Min</span>
                <span className={styles.statValue}>${s.minInvest}</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Commission</span>
                <span className={styles.statValue}>{s.commission}%</span>
              </div>
            </div>

            <Button
              fullWidth
              icon={Copy}
              onClick={() => showToast(`Copying ${s.name}`)}
            >
              Copy
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}

function Sparkline({ series }) {
  const W = 120;
  const H = 40;
  const pad = 3;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const x = (i) => pad + (i * (W - pad * 2)) / (series.length - 1);
  const y = (v) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.spark}
      preserveAspectRatio="none"
      role="img"
      aria-label="Performance trend"
    >
      <polyline points={points} className={styles.sparkLine} fill="none" />
    </svg>
  );
}
