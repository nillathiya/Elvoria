"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import Card from "@/app/components/Card";
import Badge from "@/app/components/Badge";
import Button from "@/app/components/Button";
import Table from "@/app/components/Table";
import { useApp } from "@/app/context/AppContext";
import { closedOrders, formatMoney } from "@/lib/mockData";
import styles from "./page.module.css";

const PER_PAGE = 10;

const typeOptions = ["All", "Buy", "Sell"];
const dateOptions = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

// Fixed reference date for deterministic mock filtering (spec date context).
const NOW = new Date("2025-07-13");

// Unique symbols pulled from the dataset.
const symbolOptions = ["All", ...Array.from(new Set(closedOrders.map((o) => o.symbol)))];

function fmtDateTime(str) {
  const [date, time] = str.split(" ");
  return { date, time };
}

export default function OrdersHistoryPage() {
  const { showToast } = useApp();
  const [symbolFilter, setSymbolFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortKey, setSortKey] = useState("closeTime");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = closedOrders.map((o) => ({ ...o, id: o.ticket }));

    if (symbolFilter !== "All") rows = rows.filter((r) => r.symbol === symbolFilter);
    if (typeFilter !== "All") rows = rows.filter((r) => r.side === typeFilter);
    if (dateFilter !== "all") {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date(NOW);
      cutoff.setDate(cutoff.getDate() - days);
      rows = rows.filter((r) => new Date(r.closeTime) >= cutoff);
    }

    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === "closeTime") {
        av = new Date(a.closeTime).getTime();
        bv = new Date(b.closeTime).getTime();
      } else if (sortKey === "profit") {
        av = a.profit;
        bv = b.profit;
      } else {
        av = String(a[sortKey]).toLowerCase();
        bv = String(b[sortKey]).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [symbolFilter, typeFilter, dateFilter, sortKey, sortDir]);

  const netProfit = useMemo(() => filtered.reduce((sum, r) => sum + r.profit, 0), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const resetPage = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const columns = [
    {
      key: "symbol",
      header: "Symbol",
      sortable: true,
      render: (r) => <span className={styles.symbol}>{r.symbol}</span>,
    },
    {
      key: "side",
      header: "Type",
      render: (r) => <Badge variant={r.side === "Buy" ? "success" : "error"}>{r.side}</Badge>,
    },
    {
      key: "volume",
      header: "Volume",
      align: "right",
      render: (r) => <span className={styles.num}>{r.volume.toFixed(2)} lots</span>,
    },
    {
      key: "openPrice",
      header: "Open price",
      align: "right",
      render: (r) => <span className={styles.num}>{r.openPrice}</span>,
    },
    {
      key: "closePrice",
      header: "Close price",
      align: "right",
      render: (r) => <span className={styles.num}>{r.closePrice}</span>,
    },
    {
      key: "openTime",
      header: "Open time",
      render: (r) => {
        const { date, time } = fmtDateTime(r.openTime);
        return (
          <span className={styles.timeCell}>
            <span className={styles.timeDate}>{date}</span>
            <span className={styles.timeClock}>{time}</span>
          </span>
        );
      },
    },
    {
      key: "closeTime",
      header: "Close time",
      sortable: true,
      render: (r) => {
        const { date, time } = fmtDateTime(r.closeTime);
        return (
          <span className={styles.timeCell}>
            <span className={styles.timeDate}>{date}</span>
            <span className={styles.timeClock}>{time}</span>
          </span>
        );
      },
    },
    {
      key: "swap",
      header: "Swap",
      align: "right",
      render: (r) => (
        <span className={styles.num} style={{ color: r.swap < 0 ? "var(--error)" : "var(--success)" }}>
          {formatMoney(r.swap)}
        </span>
      ),
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      render: (r) => (
        <span className={styles.num} style={{ color: "var(--error)" }}>
          {formatMoney(r.commission)}
        </span>
      ),
    },
    {
      key: "profit",
      header: "Profit",
      align: "right",
      sortable: true,
      render: (r) => (
        <span
          className={styles.num}
          style={{ color: r.profit >= 0 ? "var(--success)" : "var(--error)", fontWeight: 700 }}
        >
          {formatMoney(r.profit)}
        </span>
      ),
    },
    {
      key: "ticket",
      header: "Ticket",
      align: "right",
      render: (r) => <span className={styles.mono}>{r.ticket}</span>,
    },
  ];

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>History of orders</h1>
          <p className={styles.sub}>{filtered.length} closed orders</p>
        </div>
        <div className={styles.headActions}>
          <div className={styles.netChip}>
            <span className={styles.netLabel}>Net profit</span>
            <span
              className={styles.netValue}
              style={{ color: netProfit >= 0 ? "var(--success)" : "var(--error)" }}
            >
              {formatMoney(netProfit)}
            </span>
          </div>
          <Button variant="outline" icon={Download} onClick={() => showToast("Orders exported successfully")}>
            Export
          </Button>
        </div>
      </header>

      <Card padding="sm" className={styles.filters}>
        <Filter label="Symbol" value={symbolFilter} onChange={resetPage(setSymbolFilter)} options={symbolOptions} />
        <Filter label="Type" value={typeFilter} onChange={resetPage(setTypeFilter)} options={typeOptions} />
        <Filter label="Date range" value={dateFilter} onChange={resetPage(setDateFilter)} options={dateOptions} />
      </Card>

      <Card padding="sm" className={styles.tableCard}>
        <Table
          columns={columns}
          data={paged}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          emptyMessage="No orders match your filters"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={[styles.pageBtn, p === currentPage ? styles.pageActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Filter({ label, value, onChange, options }) {
  return (
    <label className={styles.filter}>
      <span className={styles.filterLabel}>{label}</span>
      <div className={styles.selectWrap}>
        <select value={value} onChange={onChange} className={styles.select}>
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
