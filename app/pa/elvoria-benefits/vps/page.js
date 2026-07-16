"use client";

import { Gauge, Server, ShieldCheck, Check, MapPin } from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import { useApp } from "@/app/context/AppContext";
import { vpsPlans } from "@/lib/demoData";
import styles from "./page.module.css";

const highlights = [
  { icon: Gauge, text: "< 4 ms latency to trade servers" },
  { icon: Server, text: "99.9% uptime" },
  { icon: ShieldCheck, text: "MT4 & MT5 ready" },
];

const locations = [
  { city: "London", ms: 3 },
  { city: "New York", ms: 2 },
  { city: "Amsterdam", ms: 4 },
  { city: "Singapore", ms: 5 },
  { city: "Frankfurt", ms: 3 },
  { city: "Tokyo", ms: 6 },
];

export default function VpsPage() {
  const { showToast } = useApp();

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Virtual Private Server</h1>
          <p className={styles.sub}>
            Trade 24/7 with ultra-low latency, even when your PC is off
          </p>
        </div>
      </header>

      <section className={styles.highlights}>
        {highlights.map((h) => {
          const Icon = h.icon;
          return (
            <Card key={h.text} variant="glass" className={styles.highlight}>
              <span className={styles.highlightIcon}>
                <Icon size={20} />
              </span>
              <span className={styles.highlightText}>{h.text}</span>
            </Card>
          );
        })}
      </section>

      <section className={styles.plans}>
        {vpsPlans.map((plan) => {
          const specs = [
            { label: "Latency", value: plan.latency },
            { label: "RAM", value: plan.ram },
            { label: "CPU", value: plan.cpu },
            { label: "Storage", value: plan.storage },
          ];
          return (
            <Card
              key={plan.id}
              variant={plan.popular ? "highlighted" : "default"}
              padding="lg"
              className={`${styles.plan} ${plan.popular ? styles.planPopular : ""}`}
            >
              <div className={styles.planHead}>
                <h3 className={styles.planName}>{plan.name}</h3>
                {plan.popular && <Badge variant="warning">Most popular</Badge>}
              </div>

              <div className={styles.price}>{plan.priceLabel}</div>

              <div className={styles.specs}>
                {specs.map((s) => (
                  <div key={s.label} className={styles.specRow}>
                    <span className={styles.specLabel}>{s.label}</span>
                    <span className={styles.specValue}>{s.value}</span>
                  </div>
                ))}
              </div>

              <p className={styles.eligible}>{plan.eligible}</p>

              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f} className={styles.featureRow}>
                    <Check size={15} className={styles.featureIcon} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                fullWidth
                variant={plan.popular ? "primary" : "outline"}
                className={styles.planCta}
                onClick={() => showToast(`${plan.name} VPS selected`, "success")}
              >
                {plan.popular ? "Get VPS" : "Choose plan"}
              </Button>
            </Card>
          );
        })}
      </section>

      <Card padding="lg" className={styles.locations}>
        <div className={styles.locHead}>
          <h2 className={styles.sectionTitle}>Server locations</h2>
          <p className={styles.sectionSub}>
            Choose a region close to your broker for the lowest possible latency.
          </p>
        </div>
        <div className={styles.locList}>
          {locations.map((l) => (
            <div key={l.city} className={styles.locChip}>
              <MapPin size={15} className={styles.locPin} />
              <span className={styles.locCity}>{l.city}</span>
              <span className={styles.locMs}>{l.ms} ms</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
