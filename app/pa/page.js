"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import CountUp from "../components/CountUp";
import Table from "../components/Table";
import { useApp } from "../context/AppContext";
import {
  balances,
  formatMoney,
  statusVariant,
  accountTypeVariant,
} from "@/lib/mockData";
import styles from "./page.module.css";

export default function OverviewPage() {
  const router = useRouter();
  const { user, accounts, transactions } = useApp();
  const recent = transactions.slice(0, 4);
  const topAccounts = accounts.filter((a) => a.mode === "Real").slice(0, 2);

  const columns = [
    { key: "date", header: "Date", render: (r) => <span className="text-secondary">{r.date}</span> },
    { key: "type", header: "Type", render: (r) => r.type },
    {
      key: "amount",
      header: "Amount",
      align: "right",
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
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
  ];

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.greeting}>
          Welcome back, {user.firstName} <span className={styles.wave}>👋</span>
        </h1>
        <p className={styles.sub}>Here&apos;s your trading overview for today</p>
      </header>

      {/* Balance cards */}
      <section className={`${styles.balances} stagger`}>
        {balances.map((b) => (
          <Card key={b.key} variant="glass" hoverable className={styles.balanceCard}>
            <span className="overline">{b.label}</span>
            <div className={styles.balanceValue}>
              <CountUp value={b.value} prefix="$" />
            </div>
            <Badge variant={b.positive ? "success" : "error"} icon={b.positive ? TrendingUp : TrendingDown}>
              {b.positive ? "+" : ""}
              {b.change}%
            </Badge>
          </Card>
        ))}
      </section>

      {/* Quick actions */}
      <Card className={styles.quickCard}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          <Button variant="outline" size="lg" icon={ArrowDownToLine} onClick={() => router.push("/pa/deposit")}>
            Deposit
          </Button>
          <Button variant="outline" size="lg" icon={ArrowUpFromLine} onClick={() => router.push("/pa/withdraw")}>
            Withdraw
          </Button>
          <Button variant="outline" size="lg" icon={Plus} onClick={() => router.push("/pa/trading/accounts")}>
            New Account
          </Button>
        </div>
      </Card>

      <div className={styles.grid}>
        {/* Recent transactions */}
        <Card className={styles.tableCard}>
          <div className={styles.cardHead}>
            <h2 className={styles.sectionTitle}>Recent Transactions</h2>
            <Link href="/pa/transactions" className={styles.viewAll}>
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <Table columns={columns} data={recent} />
        </Card>

        {/* My accounts */}
        <Card className={styles.accountsCard}>
          <div className={styles.cardHead}>
            <h2 className={styles.sectionTitle}>My Accounts</h2>
            <Link href="/pa/trading/accounts" className={styles.viewAll}>
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className={styles.accountList}>
            {topAccounts.map((a) => (
              <div key={a.id} className={styles.accountItem}>
                <div className={styles.accountTop}>
                  <div>
                    <div className={styles.accountId}>#{a.id}</div>
                    <div className={styles.accountMeta}>
                      {a.platform} · {a.mode}
                    </div>
                  </div>
                  <Badge variant={accountTypeVariant(a.type)}>{a.type}</Badge>
                </div>
                <div className={styles.accountBalance}>{formatMoney(a.balance, a.currency)}</div>
                <div className={styles.accountFoot}>
                  <span className="caption">Leverage {a.leverage}</span>
                  <Button size="sm" variant="secondary" onClick={() => router.push("/pa/trading/accounts")}>
                    Trade
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
