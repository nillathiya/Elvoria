"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import Card from "@/app/components/Card";
import Badge from "@/app/components/Badge";
import Button from "@/app/components/Button";
import Table from "@/app/components/Table";
import { useApp } from "@/app/context/AppContext";
import { formatMoney } from "@/lib/config";
import { demoStatusVariant } from "@/lib/demoData";
import styles from "./page.module.css";

const PER_PAGE = 10;

const typeOptions = ["All", "Deposit", "Withdraw", "Internal"];
const statusOptions = ["All", "Completed", "Pending", "Failed"];
const dateOptions = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

// Fixed reference date for deterministic mock filtering.
const NOW = new Date("2025-07-13");

export default function PaymentsHistoryPage() {
  const { transactions, showToast } = useApp();
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...transactions];

    if (typeFilter !== "All") rows = rows.filter((r) => r.type === typeFilter);
    if (statusFilter !== "All") rows = rows.filter((r) => r.status === statusFilter);
    if (dateFilter !== "all") {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date(NOW);
      cutoff.setDate(cutoff.getDate() - days);
      rows = rows.filter((r) => new Date(r.rawDate) >= cutoff);
    }

    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === "date") {
        av = new Date(a.rawDate).getTime();
        bv = new Date(b.rawDate).getTime();
      } else if (sortKey === "amount") {
        av = a.amount;
        bv = b.amount;
      } else {
        av = String(a[sortKey]).toLowerCase();
        bv = String(b[sortKey]).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [transactions, typeFilter, statusFilter, dateFilter, sortKey, sortDir]);

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

  const handleExport = () => {
    showToast("Transaction history exported");
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (r) => <span className={styles.mono}>{r.id}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (r) => <span className="text-secondary">{r.date}</span>,
    },
    { key: "type", header: "Type" },
    { key: "method", header: "Method" },
    {
      key: "account",
      header: "Account",
      render: (r) => <span className={styles.mono}>#{r.account.slice(0, 4)}…</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (r) => (
        <span style={{ color: r.amount < 0 ? "var(--error)" : "var(--success)", fontWeight: 600 }}>
          {r.amount < 0 ? "-" : "+"}
          {formatMoney(Math.abs(r.amount))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      sortable: true,
      render: (r) => <Badge variant={demoStatusVariant(r.status)}>{r.status}</Badge>,
    },
  ];

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Transaction history</h1>
          <p className={styles.sub}>{filtered.length} transactions</p>
        </div>
        <Button variant="outline" icon={Download} onClick={handleExport}>
          Export
        </Button>
      </header>

      <Card padding="sm" className={styles.filters}>
        <Filter label="Type" value={typeFilter} onChange={resetPage(setTypeFilter)} options={typeOptions} />
        <Filter label="Status" value={statusFilter} onChange={resetPage(setStatusFilter)} options={statusOptions} />
        <Filter label="Date" value={dateFilter} onChange={resetPage(setDateFilter)} options={dateOptions} />
      </Card>

      <Card padding="sm" className={styles.tableCard}>
        <Table
          columns={columns}
          data={paged}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          emptyMessage="No transactions match your filters"
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
