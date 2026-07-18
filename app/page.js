"use client";

// ============================================================
//  Public marketing landing page (the "/" route).
//
//  Modeled on the layout of a large multi-asset broker homepage
//  (hero → stats → markets → why-us → platforms → steps → CTA →
//  footer). The login form that used to live here now lives at
//  /login; this page's CTAs point at /login and /register.
//
//  The markets section and the hero chart show REAL data pulled
//  client-side from free, key-less providers:
//    • Currencies — European Central Bank reference rates via the
//      Frankfurter API (api.frankfurter.dev). One time-series call
//      powers the live price, the daily change and the sparkline.
//    • Crypto — CoinGecko's public markets endpoint (live price,
//      24h change and a 7-day sparkline).
//  Nothing here is fabricated: if a provider is unreachable the
//  section says so rather than inventing numbers.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Clock,
  Headphones,
  Gauge,
  Wallet,
  LineChart,
  Smartphone,
  Monitor,
  Globe,
  Check,
  TrendingUp,
  TrendingDown,
  Star,
  Menu,
  X,
} from "lucide-react";
import Logo from "./components/Logo";
import { BRAND } from "@/lib/config";
import { legalLinks } from "@/lib/legalDocs";
import styles from "./page.module.css";

// ---- Data providers (free, no API key) ----------------------
// Everything is quoted against USD so a single Frankfurter time-series call
// (base=USD) lets us derive every major pair: for X per 1 USD = r[X],
//   EUR/USD = 1 / r.EUR,  USD/JPY = r.JPY,  etc.
const FX_SYMBOLS = ["EUR", "GBP", "JPY", "CHF", "CAD", "AUD"];
const FX_PAIRS = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", calc: (r) => 1 / r.EUR, dp: 4 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", calc: (r) => 1 / r.GBP, dp: 4 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", calc: (r) => r.JPY, dp: 2 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", calc: (r) => r.CHF, dp: 4 },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", calc: (r) => r.CAD, dp: 4 },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", calc: (r) => 1 / r.AUD, dp: 4 },
];

const CRYPTO_IDS = ["bitcoin", "ethereum", "solana", "ripple", "cardano"];

const STATS = [
  { value: "$4.2T+", label: "Indicative monthly volume" },
  { value: "180+", label: "Countries served" },
  { value: "0.0 pips", label: "Spreads from" },
  { value: "24/7", label: "Withdrawals & support" },
];

const FEATURES = [
  {
    icon: Gauge,
    title: "Ultra-low spreads",
    desc: "Tight, stable pricing across every asset class — spreads that start from zero on core instruments.",
  },
  {
    icon: Zap,
    title: "Instant withdrawals",
    desc: "The overwhelming majority of withdrawals are processed automatically, around the clock.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    desc: "Segregated design, encrypted sessions and server-side session control keep your account protected.",
  },
  {
    icon: Clock,
    title: "Always-on trading",
    desc: "Reliable execution with no artificial requotes — trade the markets whenever they move.",
  },
  {
    icon: Headphones,
    title: "Human support",
    desc: "Multilingual support that answers real questions — no scripted bot standing between you and help.",
  },
  {
    icon: Wallet,
    title: "Flexible funding",
    desc: "Fund and withdraw through the methods that work for you, with clear status at every step.",
  },
];

const PLATFORMS = [
  {
    icon: Monitor,
    title: `${BRAND} Terminal`,
    tag: "Web",
    desc: "Full-featured browser trading — charts, orders and analytics with nothing to install.",
    href: "/webtrading",
  },
  {
    icon: LineChart,
    title: "Desktop Pro",
    tag: "Windows · macOS",
    desc: "A power workspace for advanced charting, multi-monitor layouts and one-click execution.",
    href: "/webtrading",
  },
  {
    icon: Smartphone,
    title: `${BRAND} App`,
    tag: "iOS · Android",
    desc: "Manage positions, deposits and alerts from your pocket — install it straight to your home screen.",
    href: "/register",
  },
];

const STEPS = [
  { n: "01", title: "Register", desc: "Open your account in minutes with just an email." },
  { n: "02", title: "Verify", desc: "Confirm your details to unlock full funding and withdrawals." },
  { n: "03", title: "Deposit", desc: "Fund your account with your preferred method." },
  { n: "04", title: "Trade", desc: "Access live currency and crypto markets in one place." },
];

// ---- Formatting helpers -------------------------------------
function fmtFixed(v, dp) {
  return v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function fmtCrypto(v) {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (v >= 1) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
function pct(n) {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

// A pure-SVG sparkline drawn from a real price series.
function Sparkline({ data, variant = "row", up = true }) {
  const w = variant === "hero" ? 320 : 96;
  const h = variant === "hero" ? 90 : 32;
  if (!data || data.length < 2) {
    return <svg className={variant === "hero" ? styles.sparkHero : styles.sparkRow} viewBox={`0 0 ${w} ${h}`} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const pad = 3;
  const pts = data.map((v, i) => [
    i * stepX,
    h - pad - ((v - min) / range) * (h - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const stroke = variant === "hero" ? "var(--accent)" : up ? "var(--success)" : "var(--error)";

  if (variant === "hero") {
    const area = `${line} L${w},${h} L0,${h} Z`;
    return (
      <svg className={styles.sparkHero} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="sparkFillHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sparkFillHero)" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={styles.sparkRow} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function RowSkeleton() {
  return (
    <tr>
      <td colSpan={6}>
        <span className={`${styles.skelRow} skeleton`} />
      </td>
    </tr>
  );
}

export default function LandingPage() {
  const [tab, setTab] = useState("Currencies");
  const [menuOpen, setMenuOpen] = useState(false);

  const [fx, setFx] = useState({ loading: true, error: "", rows: [], asOf: "" });
  const [crypto, setCrypto] = useState({ loading: true, error: "", rows: [] });

  // ---- Currencies: one Frankfurter time-series call powers price, the
  //      daily change and the sparkline for every pair. ECB rates are daily
  //      reference rates, so "change" is day-over-day, labelled as such.
  const loadFx = useCallback(async () => {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 60);
      const start = from.toISOString().slice(0, 10);
      const url = `https://api.frankfurter.dev/v1/${start}..?base=USD&symbols=${FX_SYMBOLS.join(",")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const dates = Object.keys(json.rates || {}).sort();
      if (dates.length < 2) throw new Error("no data");

      const rows = FX_PAIRS.map((p) => {
        const series = dates
          .map((d) => {
            const r = json.rates[d];
            const v = r ? p.calc(r) : null;
            return Number.isFinite(v) ? v : null;
          })
          .filter((v) => v !== null);
        const price = series[series.length - 1];
        const prev = series[series.length - 2];
        const change = prev ? ((price - prev) / prev) * 100 : 0;
        return {
          symbol: p.symbol,
          name: p.name,
          priceText: fmtFixed(price, p.dp),
          change,
          up: change >= 0,
          series,
          high: fmtFixed(Math.max(...series), p.dp),
          low: fmtFixed(Math.min(...series), p.dp),
        };
      });
      setFx({ loading: false, error: "", rows, asOf: json.end_date || dates[dates.length - 1] });
    } catch (e) {
      setFx({ loading: false, error: "Live rates are temporarily unavailable.", rows: [], asOf: "" });
    }
  }, []);

  // ---- Crypto: CoinGecko markets endpoint (live price, 24h change, 7d spark).
  const loadCrypto = useCallback(async () => {
    try {
      const url =
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd" +
        `&ids=${CRYPTO_IDS.join(",")}&order=market_cap_desc&price_change_percentage=24h&sparkline=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = json.map((c) => {
        const change = c.price_change_percentage_24h ?? 0;
        return {
          symbol: `${c.symbol.toUpperCase()}/USD`,
          name: c.name,
          priceText: fmtCrypto(c.current_price),
          change,
          up: change >= 0,
          series: c.sparkline_in_7d?.price || [],
        };
      });
      setCrypto({ loading: false, error: "", rows });
    } catch (e) {
      setCrypto({ loading: false, error: "Live crypto prices are temporarily unavailable.", rows: [] });
    }
  }, []);

  useEffect(() => {
    loadFx();
    loadCrypto();
    // Crypto moves intraday — refresh it every 60s. FX (ECB) updates daily.
    const id = setInterval(loadCrypto, 60_000);
    return () => clearInterval(id);
  }, [loadFx, loadCrypto]);

  const nav = [
    { label: "Markets", href: "#markets" },
    { label: "Why Elvoria", href: "#why" },
    { label: "Platforms", href: "#platforms" },
    { label: "Get started", href: "#start" },
  ];

  const active = tab === "Currencies" ? fx : crypto;
  const changeLabel = tab === "Currencies" ? "1D" : "24h";
  const hero = fx.rows[0]; // EUR/USD, live

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label={`${BRAND} home`}>
            <Logo size={34} />
          </Link>

          <nav className={styles.nav}>
            {nav.map((n) => (
              <a key={n.href} href={n.href} className={styles.navLink}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link href="/login" className={styles.signIn}>
              Sign in
            </Link>
            <Link href="/register" className={styles.openAccount}>
              Open account
            </Link>
            <button
              className={styles.menuBtn}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className={styles.mobileNav}>
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                {n.label}
              </a>
            ))}
            <Link href="/login" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
            <Link
              href="/register"
              className={styles.mobileOpen}
              onClick={() => setMenuOpen(false)}
            >
              Open account
            </Link>
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.pill}>
              <Star size={14} /> Trusted by traders in 180+ countries
            </span>
            <h1 className={styles.heroTitle}>
              Trade the world&apos;s markets with <span className={styles.accentText}>{BRAND}</span>
            </h1>
            <p className={styles.heroSub}>
              Currencies, crypto and more — one account, ultra-low spreads and withdrawals that
              don&apos;t keep you waiting.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/register" className={styles.ctaPrimary}>
                Open account <ArrowRight size={18} />
              </Link>
              <Link href="/login" className={styles.ctaGhost}>
                Sign in
              </Link>
            </div>
            <div className={styles.heroTrust}>
              <span><Check size={15} /> No requotes</span>
              <span><Check size={15} /> Instant withdrawals</span>
              <span><Check size={15} /> Live market pricing</span>
            </div>
          </div>

          {/* Live quote card — real EUR/USD from the ECB via Frankfurter */}
          <div className={styles.heroCard}>
            <div className={styles.quoteHead}>
              <div>
                <div className={styles.quoteSymbol}>{hero ? hero.symbol : "EUR/USD"}</div>
                <div className={styles.quoteName}>
                  <span className={styles.liveDot} /> {hero ? "ECB reference · live" : "Loading…"}
                </div>
              </div>
              {hero && (
                <span className={hero.up ? styles.quoteUp : styles.quoteDown}>
                  {hero.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {pct(hero.change)}
                </span>
              )}
            </div>
            <div className={styles.quotePrice}>
              {hero ? hero.priceText : <span className={`${styles.skelPrice} skeleton`} />}
            </div>
            <Sparkline data={hero?.series} variant="hero" up={hero?.up} />
            <div className={styles.quoteRow}>
              <div>
                <span className={styles.quoteLabel}>60D High</span>
                <span className={styles.quoteVal}>{hero ? hero.high : "—"}</span>
              </div>
              <div>
                <span className={styles.quoteLabel}>60D Low</span>
                <span className={styles.quoteVal}>{hero ? hero.low : "—"}</span>
              </div>
              <div>
                <span className={styles.quoteLabel}>Change</span>
                <span className={`${styles.quoteVal} ${hero ? (hero.up ? styles.up : styles.down) : ""}`}>
                  {hero ? pct(hero.change) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ---------- Markets ---------- */}
      <section id="markets" className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.overline}>Markets</span>
          <h2 className={styles.sectionTitle}>Live prices, one account</h2>
          <p className={styles.sectionSub}>
            Real-time currency and crypto pricing pulled straight from public market data.
          </p>
        </div>

        <div className={styles.tabs} role="tablist">
          {["Currencies", "Crypto"].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={t === tab}
              className={`${styles.tab} ${t === tab ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Instrument</th>
                <th className={styles.hideSm}>Name</th>
                <th className={styles.num}>Price</th>
                <th className={styles.num}>{changeLabel}</th>
                <th className={`${styles.num} ${styles.hideSm}`}>Trend</th>
                <th className={styles.num}></th>
              </tr>
            </thead>
            <tbody>
              {active.loading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : active.error ? (
                <tr>
                  <td colSpan={6} className={styles.errCell}>
                    {active.error}
                  </td>
                </tr>
              ) : (
                active.rows.map((r) => (
                  <tr key={r.symbol}>
                    <td className={styles.sym}>{r.symbol}</td>
                    <td className={styles.hideSm}>{r.name}</td>
                    <td className={styles.num}>{r.priceText}</td>
                    <td className={`${styles.num} ${r.up ? styles.up : styles.down}`}>
                      <span className={styles.changeCell}>
                        {r.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {pct(r.change)}
                      </span>
                    </td>
                    <td className={`${styles.num} ${styles.hideSm}`}>
                      <span className={styles.trendCell}>
                        <Sparkline data={r.series} up={r.up} />
                      </span>
                    </td>
                    <td className={styles.num}>
                      <Link href="/register" className={styles.tradeBtn}>
                        Trade
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className={styles.indicative}>
          {tab === "Currencies" ? (
            <>
              Currency rates: European Central Bank reference rates via Frankfurter
              {fx.asOf ? ` · updated ${fx.asOf}` : ""}. Daily reference rates, not tick data.
            </>
          ) : (
            <>Crypto prices: CoinGecko public market data · refreshes every 60 seconds.</>
          )}
        </p>
      </section>

      {/* ---------- Why ---------- */}
      <section id="why" className={styles.sectionAlt}>
        <div className={styles.sectionHead}>
          <span className={styles.overline}>Why {BRAND}</span>
          <h2 className={styles.sectionTitle}>Built for traders who value their time</h2>
          <p className={styles.sectionSub}>
            Everything that gets in the way of trading — slow payouts, hidden costs, robotic
            support — designed out from the start.
          </p>
        </div>

        <div className={`${styles.featureGrid} stagger`}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <Icon size={22} />
                </span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Platforms ---------- */}
      <section id="platforms" className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.overline}>Platforms</span>
          <h2 className={styles.sectionTitle}>Trade anywhere, on any screen</h2>
          <p className={styles.sectionSub}>
            The same account across web, desktop and mobile — pick up exactly where you left off.
          </p>
        </div>

        <div className={styles.platformGrid}>
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.title} href={p.href} className={styles.platformCard}>
                <span className={styles.platformIcon}>
                  <Icon size={24} />
                </span>
                <span className={styles.platformTag}>{p.tag}</span>
                <h3 className={styles.platformTitle}>{p.title}</h3>
                <p className={styles.platformDesc}>{p.desc}</p>
                <span className={styles.platformLink}>
                  Explore <ArrowRight size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Steps ---------- */}
      <section id="start" className={styles.sectionAlt}>
        <div className={styles.sectionHead}>
          <span className={styles.overline}>Get started</span>
          <h2 className={styles.sectionTitle}>Start trading in four steps</h2>
        </div>

        <div className={styles.steps}>
          {STEPS.map((s) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA band ---------- */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaBandInner}>
          <h2 className={styles.ctaBandTitle}>Ready to trade with {BRAND}?</h2>
          <p className={styles.ctaBandSub}>
            Open your account today — it only takes a few minutes.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className={styles.ctaPrimary}>
              Open account <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={styles.ctaGhostDark}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Logo size={38} />
            <p className={styles.footerBlurb}>
              {BRAND} is a demonstration multi-asset trading interface. It is not a licensed
              financial services provider and is not affiliated with any real brokerage.
            </p>
            <div className={styles.footerLang}>
              <Globe size={15} /> English
            </div>
          </div>

          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <div className={styles.footerHeading}>Trade</div>
              <a href="#markets" className={styles.footerLink}>Markets</a>
              <a href="#platforms" className={styles.footerLink}>Platforms</a>
              <Link href="/webtrading" className={styles.footerLink}>Web terminal</Link>
              <Link href="/register" className={styles.footerLink}>Open account</Link>
            </div>
            <div className={styles.footerCol}>
              <div className={styles.footerHeading}>Company</div>
              <a href="#why" className={styles.footerLink}>Why {BRAND}</a>
              <a href="#start" className={styles.footerLink}>Get started</a>
              <Link href="/login" className={styles.footerLink}>Sign in</Link>
            </div>
            <div className={styles.footerCol}>
              <div className={styles.footerHeading}>Legal</div>
              {legalLinks().map((l) => (
                <Link key={l.slug} href={`/legal/${l.slug}`} className={styles.footerLink}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footerLegal}>
          <p>
            Trading leveraged products carries a high level of risk and may not be suitable for
            everyone. Market data on this page is sourced from the European Central Bank
            (via Frankfurter) and CoinGecko and is provided for information only.
          </p>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2008 – 2026. {BRAND}</span>
          <span>{BRAND}.com</span>
        </div>
      </footer>
    </div>
  );
}
