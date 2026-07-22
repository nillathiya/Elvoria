"use client";

import { useState, useMemo } from "react";
import {
  Search,
  UserRound,
  Wallet,
  CandlestickChart,
  SlidersHorizontal,
  ShieldCheck,
  Users,
  ChevronDown,
  Mail,
  LifeBuoy,
} from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import WhatsAppIcon from "@/app/components/WhatsAppIcon";
import { useApp } from "@/app/context/AppContext";
import { helpCategories, helpFaqs } from "@/lib/demoData";
import { whatsappHref, SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY } from "@/lib/config";
import styles from "./page.module.css";

const CATEGORY_ICONS = {
  user: UserRound,
  wallet: Wallet,
  chart: CandlestickChart,
  sliders: SlidersHorizontal,
  shield: ShieldCheck,
  users: Users,
};

export default function HelpCenterPage() {
  const { showToast } = useApp();
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return helpFaqs;
    return helpFaqs.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Help center</h1>
          <p className={styles.sub}>
            Search our knowledge base or contact support
          </p>
        </div>
      </header>

      {/* Search */}
      <Card variant="glass" padding="lg" className={styles.searchCard}>
        <div className={styles.searchInner}>
          <div className={styles.searchIcon}>
            <LifeBuoy size={20} />
          </div>
          <h2 className={styles.searchTitle}>How can we help you today?</h2>
          <Input
            icon={Search}
            placeholder="Search articles, guides & FAQs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </Card>

      {/* Categories */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Browse by category</h2>
        <div className={`${styles.catGrid} stagger`}>
          {helpCategories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon] || LifeBuoy;
            return (
              <Card
                key={c.id}
                hoverable
                className={styles.catCard}
                onClick={() => showToast(`Opening ${c.title}`)}
              >
                <span className={styles.catIcon}>
                  <Icon size={22} />
                </span>
                <div className={styles.catText}>
                  <div className={styles.catTitle}>{c.title}</div>
                  <p className={styles.catDesc}>{c.desc}</p>
                  <span className={styles.catCount}>{c.articles} articles</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ accordion */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
        <Card className={styles.faqCard}>
          {filteredFaqs.length === 0 ? (
            <div className={styles.empty}>
              <Search size={28} />
              <p className={styles.emptyTitle}>No results for “{query}”</p>
              <p className={styles.emptySub}>
                Try a different keyword or reach out to our support team below.
              </p>
            </div>
          ) : (
            filteredFaqs.map((f, i) => {
              const open = openIndex === i;
              return (
                <div key={f.q} className={styles.faqItem}>
                  <button
                    className={styles.faqQ}
                    onClick={() => setOpenIndex(open ? -1 : i)}
                    aria-expanded={open}
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      size={18}
                      className={[styles.chevron, open ? styles.chevronOpen : ""]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  </button>
                  {open && <p className={styles.faqA}>{f.a}</p>}
                </div>
              );
            })
          )}
        </Card>
      </section>

      {/* Contact CTA */}
      <Card variant="highlighted" className={styles.cta}>
        <div className={styles.ctaText}>
          <h2 className={styles.ctaTitle}>Still need help?</h2>
          <p className={styles.ctaSub}>
            Our support team is available 24/7 on WhatsApp at {SUPPORT_WHATSAPP_DISPLAY}.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <Button
            icon={WhatsAppIcon}
            onClick={() =>
              window.open(
                whatsappHref("Hi Elvoria, I need help with my account."),
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            Chat on WhatsApp
          </Button>
          <Button
            variant="outline"
            icon={Mail}
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}`;
            }}
          >
            Email us
          </Button>
        </div>
      </Card>
    </div>
  );
}
