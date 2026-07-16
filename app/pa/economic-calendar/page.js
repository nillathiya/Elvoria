"use client";

import { useState, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import Card from "@/app/components/Card";
import { economicEvents } from "@/lib/demoData";
import styles from "./page.module.css";

const IMPACTS = ["All", "High", "Medium", "Low"];

function impactClass(impact) {
  if (impact === "High") return styles.dotHigh;
  if (impact === "Medium") return styles.dotMedium;
  return styles.dotLow;
}

export default function EconomicCalendarPage() {
  const [impact, setImpact] = useState("All");
  const [currency, setCurrency] = useState("All");

  const currencies = useMemo(
    () => ["All", ...Array.from(new Set(economicEvents.map((e) => e.currency)))],
    []
  );

  const rows = economicEvents.filter(
    (e) =>
      (impact === "All" || e.impact === impact) &&
      (currency === "All" || e.currency === currency)
  );

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Economic calendar</h1>
          <p className={styles.sub}>Today · high-impact events highlighted</p>
        </div>
        <span className={styles.dateChip}>
          <CalendarDays size={15} />
          Today
        </span>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Impact</span>
          <div className={styles.pills}>
            {IMPACTS.map((i) => (
              <button
                key={i}
                className={[styles.pill, impact === i ? styles.pillActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setImpact(i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <label className={styles.filterGroup}>
          <span className={styles.filterLabel}>Currency</span>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All currencies" : c}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <Card padding="sm" className={styles.tableCard}>
        <div className={styles.table} role="table">
          <div className={styles.rowHead} role="row">
            <span>Time</span>
            <span>Country</span>
            <span>Event</span>
            <span>Impact</span>
            <span className={styles.num}>Actual</span>
            <span className={styles.num}>Forecast</span>
            <span className={styles.num}>Previous</span>
          </div>

          {rows.length === 0 && (
            <div className={styles.empty}>No events match your filters</div>
          )}

          {rows.map((e) => (
            <div
              key={e.id}
              role="row"
              className={[styles.row, e.impact === "High" ? styles.rowHigh : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.time} data-label="Time">
                {e.time}
              </span>
              <span className={styles.country} data-label="Country">
                <span className={styles.flag}>{e.flag}</span>
                {e.currency}
              </span>
              <span className={styles.event} data-label="Event">
                {e.event}
              </span>
              <span className={styles.impact} data-label="Impact">
                <span className={`${styles.dot} ${impactClass(e.impact)}`} />
                {e.impact}
              </span>
              <span
                className={[styles.num, styles.actual, e.actual !== "—" ? styles.actualOn : ""]
                  .filter(Boolean)
                  .join(" ")}
                data-label="Actual"
              >
                {e.actual}
              </span>
              <span className={styles.num} data-label="Forecast">
                {e.forecast}
              </span>
              <span className={`${styles.num} ${styles.muted}`} data-label="Previous">
                {e.previous}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
