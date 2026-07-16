"use client";

import { useState } from "react";
import Card from "@/app/components/Card";
import Badge from "@/app/components/Badge";
import { useApp } from "@/app/context/AppContext";
import { fxNews } from "@/lib/demoData";
import styles from "./page.module.css";

const CATEGORIES = ["All", "Forex", "Commodities", "Crypto", "Indices"];

function impactVariant(impact) {
  if (impact === "High") return "error";
  if (impact === "Medium") return "warning";
  return "neutral";
}

export default function MarketNewsPage() {
  const { showToast } = useApp();
  const [category, setCategory] = useState("All");

  const items =
    category === "All"
      ? fxNews
      : fxNews.filter((n) => n.category === category);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Market news</h1>
          <p className={styles.sub}>Latest FX, commodity and crypto headlines</p>
        </div>
      </header>

      <div className={styles.chips} role="tablist" aria-label="Filter news by category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            className={[styles.chip, category === c ? styles.chipActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {!featured && (
        <Card className={styles.empty}>No news in this category right now.</Card>
      )}

      {featured && (
        <Card
          hoverable
          className={styles.featured}
          onClick={() => showToast("Opening article")}
        >
          <div className={styles.featTop}>
            <Badge variant="info" size="sm">
              {featured.category}
            </Badge>
            <Badge variant={impactVariant(featured.impact)} dot>
              {featured.impact} impact
            </Badge>
          </div>
          <h2 className={styles.featTitle}>{featured.title}</h2>
          <p className={styles.featSummary}>{featured.summary}</p>
          <div className={styles.featMetaRow}>
            <span className={styles.source}>
              {featured.source} · {featured.time}
            </span>
            <span className={styles.tags}>
              {featured.symbols.map((sym) => (
                <span key={sym} className={styles.tag}>
                  {sym}
                </span>
              ))}
            </span>
          </div>
        </Card>
      )}

      <div className={`${styles.list} stagger`}>
        {rest.map((n) => (
          <Card
            key={n.id}
            hoverable
            padding="md"
            className={styles.row}
            onClick={() => showToast("Opening article")}
          >
            <div className={styles.rowHead}>
              <h3 className={styles.rowTitle}>{n.title}</h3>
              <Badge variant={impactVariant(n.impact)} size="sm">
                {n.impact}
              </Badge>
            </div>
            <p className={styles.rowSource}>
              {n.source} · {n.time}
            </p>
            <p className={styles.rowSummary}>{n.summary}</p>
            <span className={styles.tags}>
              {n.symbols.map((sym) => (
                <span key={sym} className={styles.tag}>
                  {sym}
                </span>
              ))}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
