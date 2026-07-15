"use client";

import { useState } from "react";
import { Clock, Infinity as InfinityIcon, ShieldCheck, Check, Info } from "lucide-react";
import Card from "@/app/components/Card";
import Badge from "@/app/components/Badge";
import Table from "@/app/components/Table";
import { useApp } from "@/app/context/AppContext";
import { swapFreeInstruments } from "@/lib/mockData";
import styles from "./page.module.css";

const benefits = [
  {
    icon: Clock,
    title: "No overnight swaps",
    text: "Keep positions open past rollover without paying or earning daily swap charges.",
  },
  {
    icon: InfinityIcon,
    title: "Hold positions longer",
    text: "Run longer-term ideas without the drag of accumulating overnight financing costs.",
  },
  {
    icon: ShieldCheck,
    title: "Ideal for swing trading",
    text: "Perfect for multi-day strategies where timing matters more than the calendar.",
  },
];

export default function SwapFreePage() {
  const { showToast } = useApp();
  const [enabled, setEnabled] = useState(true);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      showToast(next ? "Swap-free enabled" : "Swap-free disabled", next ? "success" : "neutral");
      return next;
    });
  };

  const columns = [
    {
      key: "symbol",
      header: "Symbol",
      render: (row) => <span className={styles.symbol}>{row.symbol}</span>,
    },
    { key: "name", header: "Instrument" },
    {
      key: "spread",
      header: "Typical spread",
      render: (row) => <span className={styles.spread}>{row.spread}</span>,
    },
    {
      key: "swapFree",
      header: "Swap-free",
      align: "center",
      render: () => (
        <Badge variant="success" icon={Check}>
          Yes
        </Badge>
      ),
    },
  ];

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Trading Conditions</h1>
          <p className={styles.sub}>
            Swap-free trading with no overnight charges on eligible instruments
          </p>
        </div>
      </header>

      <Card variant="highlighted" padding="lg" className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.heroTop}>
            <h2 className={styles.heroTitle}>Swap-free trading</h2>
            <Badge variant={enabled ? "success" : "neutral"} dot>
              {enabled ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className={styles.heroBody}>
            Trade eligible instruments without incurring overnight swap charges. Turn it on to hold
            your positions for as long as your strategy needs, free of daily financing costs.
          </p>
        </div>
        <div className={styles.heroControl}>
          <span className={styles.toggleLabel}>{enabled ? "Enabled" : "Disabled"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Toggle swap-free trading"
            className={`${styles.toggle} ${enabled ? styles.toggleOn : ""}`}
            onClick={toggle}
          >
            <span className={styles.knob} />
          </button>
        </div>
      </Card>

      <section className={styles.benefits}>
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <Card key={b.title} hoverable className={styles.benefitCard}>
              <span className={styles.benefitIcon}>
                <Icon size={22} />
              </span>
              <h3 className={styles.benefitTitle}>{b.title}</h3>
              <p className={styles.benefitText}>{b.text}</p>
            </Card>
          );
        })}
      </section>

      <Card padding="lg" className={styles.tableCard}>
        <h2 className={styles.sectionTitle}>Eligible instruments</h2>
        <p className={styles.sectionSub}>
          The following markets are available for swap-free trading on your account.
        </p>
        <Table columns={columns} data={swapFreeInstruments} />
      </Card>

      <Card variant="outlined" className={styles.note}>
        <Info size={18} className={styles.noteIcon} />
        <p className={styles.noteText}>
          A fixed administration fee may apply on positions held beyond the grace period.
        </p>
      </Card>
    </div>
  );
}
