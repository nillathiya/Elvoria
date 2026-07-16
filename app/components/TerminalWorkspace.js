"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  X,
  ChevronDown,
  Crosshair,
  Minus as LineIcon,
  TrendingUp,
  Type,
  Settings2,
  Camera,
  Maximize2,
  Layers,
  MoreHorizontal,
  Briefcase,
  HelpCircle,
  Grip,
  LayoutGrid,
} from "lucide-react";
import Logo from "./Logo";
import { useApp } from "../context/AppContext";
import { BRAND } from "@/lib/config";
import styles from "./TerminalWorkspace.module.css";

const cx = (...c) => c.filter(Boolean).join(" ");

// ---- Instruments (mocked live quotes) matching the Exness Market Watch ----
const INSTRUMENTS = [
  { symbol: "BTC", name: "Bitcoin vs US Dollar", price: 62636.24, digits: 2, spread: 10, icon: "₿", tone: "#f7931a" },
  { symbol: "XAU/USD", name: "Gold vs US Dollar", price: 4019.24, digits: 3, spread: 0.24, icon: "Au", tone: "#e2b23a" },
  { symbol: "XAG/USD", name: "Silver vs US Dollar", price: 57.73, digits: 3, spread: 0.03, icon: "Ag", tone: "#b9c2cc" },
  { symbol: "ETH", name: "Ethereum vs US Dollar", price: 1782.3, digits: 2, spread: 1.0, icon: "Ξ", tone: "#627eea" },
  { symbol: "USOIL", name: "Crude Oil WTI", price: 79.254, digits: 3, spread: 0.02, icon: "◍", tone: "#2b2b2b" },
  { symbol: "USD/JPY", name: "US Dollar vs Yen", price: 162.31, digits: 3, spread: 0.01, icon: "¥", tone: "#c0392b" },
  { symbol: "EUR/USD", name: "Euro vs US Dollar", price: 1.139, digits: 5, spread: 0.00008, icon: "€", tone: "#2f66d0" },
  { symbol: "USTEC", name: "US Tech 100", price: 29330.68, digits: 2, spread: 3.6, icon: "★", tone: "#2f80ed" },
];

const TABS = ["BTC", "EUR/USD", "USOIL", "XAU/USD"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"];
const CHART_TOOLS = [Crosshair, LineIcon, TrendingUp, Type, Settings2];

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromSymbol(sym) {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) | 0;
  return Math.abs(h) + 1;
}
function buildCandles(symbol, price, count = 60) {
  const rand = mulberry32(seedFromSymbol(symbol));
  const vol = price * 0.0016;
  const candles = [];
  let close = price * (1 - (rand() - 0.5) * 0.02);
  for (let i = 0; i < count; i++) {
    const open = close;
    const drift = (rand() - 0.48) * vol;
    close = Math.max(open + drift + (rand() - 0.5) * vol, price * 0.9);
    const high = Math.max(open, close) + rand() * vol * 0.8;
    const low = Math.min(open, close) - rand() * vol * 0.8;
    candles.push({ o: open, h: high, l: low, c: close });
  }
  const lastC = candles[candles.length - 1];
  lastC.o = price * (1 - (rand() - 0.5) * 0.0008);
  lastC.c = price;
  lastC.h = Math.max(lastC.o, price) + rand() * vol * 0.4;
  lastC.l = Math.min(lastC.o, price) - rand() * vol * 0.4;
  return candles;
}
function fmt(value, digits) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
function money(value) {
  return `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

function PriceTicker({ value, digits, className }) {
  const s = fmt(value, digits);
  const [intp, dec = ""] = s.split(".");
  let main;
  let big;
  let sup;
  if (dec.length >= 3) {
    main = `${intp}.${dec.slice(0, dec.length - 3)}`;
    big = dec.slice(dec.length - 3, dec.length - 1);
    sup = dec.slice(dec.length - 1);
  } else if (dec.length === 2) {
    main = `${intp}.`;
    big = dec;
    sup = "";
  } else {
    main = s;
    big = "";
    sup = "";
  }
  return (
    <span className={className}>
      {main}
      <b className={styles.pipBig}>{big}</b>
      {sup && <sup className={styles.pipSup}>{sup}</sup>}
    </span>
  );
}

function CandleChart({ candles, digits, up }) {
  const W = 900;
  const H = 420;
  const padR = 70;
  const padY = 18;
  const plotW = W - padR;
  const { min, max } = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    candles.forEach((c) => {
      mn = Math.min(mn, c.l);
      mx = Math.max(mx, c.h);
    });
    const pad = (mx - mn) * 0.08 || 1;
    return { min: mn - pad, max: mx + pad };
  }, [candles]);
  const y = (v) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);
  const n = candles.length;
  const step = plotW / n;
  const bw = Math.max(step * 0.6, 2);
  const gridLines = 6;
  const last = candles[n - 1];
  return (
    <svg className={styles.chartSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const v = min + ((max - min) * i) / gridLines;
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={0} x2={plotW} y1={yy} y2={yy} className={styles.grid} />
            <text x={W - padR + 8} y={yy + 3} className={styles.axisText}>
              {fmt(v, digits)}
            </text>
          </g>
        );
      })}
      {candles.map((c, i) => {
        const cx0 = i * step + step / 2;
        const bull = c.c >= c.o;
        const cls = bull ? styles.bull : styles.bear;
        const yO = y(c.o);
        const yC = y(c.c);
        const top = Math.min(yO, yC);
        const bh = Math.max(Math.abs(yC - yO), 1);
        return (
          <g key={i}>
            <line x1={cx0} x2={cx0} y1={y(c.h)} y2={y(c.l)} className={cx(styles.wick, cls)} />
            <rect x={cx0 - bw / 2} y={top} width={bw} height={bh} className={cx(styles.candleBody, cls)} />
          </g>
        );
      })}
      <line x1={0} x2={plotW} y1={y(last.c)} y2={y(last.c)} className={cx(styles.priceLine, up ? styles.bull : styles.bear)} />
      <rect x={W - padR} y={y(last.c) - 10} width={padR} height={20} className={up ? styles.bullFill : styles.bearFill} rx={2} />
      <text x={W - padR + 6} y={y(last.c) + 4} className={styles.priceTagText}>
        {fmt(last.c, digits)}
      </text>
    </svg>
  );
}

export default function TerminalWorkspace({ standalone = false }) {
  const { showToast } = useApp();
  const router = useRouter();
  const [quotes, setQuotes] = useState(() =>
    INSTRUMENTS.map((i) => ({ ...i, prev: i.price, live: i.price }))
  );
  const [tabs, setTabs] = useState(TABS);
  const [activeSymbol, setActiveSymbol] = useState("XAU/USD");
  const [tf, setTf] = useState("1m");
  const [search, setSearch] = useState("");
  const [volume, setVolume] = useState(0.01);
  const [orderTab, setOrderTab] = useState("Market");
  const [posTab, setPosTab] = useState("Open");
  const [positions, setPositions] = useState([]);
  const [balance] = useState(10000);
  const posId = useRef(1000);

  const active = quotes.find((q) => q.symbol === activeSymbol) || quotes[0];
  const [candles, setCandles] = useState(() => buildCandles(active.symbol, active.live));

  useEffect(() => {
    setCandles(buildCandles(active.symbol, active.live));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol]);

  useEffect(() => {
    const id = setInterval(() => {
      setQuotes((prev) =>
        prev.map((q) => {
          const jitter = (Math.random() - 0.5) * q.price * 0.0006;
          const live = Math.max(q.live + jitter, q.price * 0.5);
          return { ...q, prev: q.live, live };
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setCandles((cs) => {
      if (!cs.length) return cs;
      const copy = cs.slice();
      const last = { ...copy[copy.length - 1] };
      last.c = active.live;
      last.h = Math.max(last.h, active.live);
      last.l = Math.min(last.l, active.live);
      copy[copy.length - 1] = last;
      return copy;
    });
  }, [active.live]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
  }, [quotes, search]);

  const openSymbol = useCallback(
    (sym) => {
      // In the standalone web terminal, selecting any currency routes to Deposit.
      if (standalone) {
        router.push("/pa/deposit");
        return;
      }
      setActiveSymbol(sym);
      setTabs((t) => (t.includes(sym) ? t : [...t, sym]));
    },
    [standalone, router]
  );

  const closeTab = useCallback(
    (sym, e) => {
      e.stopPropagation();
      setTabs((t) => {
        const next = t.filter((s) => s !== sym);
        if (sym === activeSymbol && next.length) setActiveSymbol(next[next.length - 1]);
        return next;
      });
    },
    [activeSymbol]
  );

  const sell = active.live - active.spread / 2;
  const buy = active.live + active.spread / 2;
  const up = active.live >= active.prev;

  const contractFor = (sym, digits) =>
    sym.includes("/") && digits >= 4 ? 100000 : sym.includes("XAU") || sym.includes("XAG") ? 100 : 1;
  const pnlOf = (p, cur) => {
    const dir = p.side === "Buy" ? 1 : -1;
    return (cur - p.entry) * dir * p.volume * contractFor(p.symbol, p.digits);
  };
  const floating = positions.reduce((s, p) => {
    const q = quotes.find((x) => x.symbol === p.symbol) || active;
    return s + pnlOf(p, q.live);
  }, 0);
  const usedMargin = positions.reduce((s, p) => s + p.volume * 1000, 0);
  const equity = balance + floating;
  const freeMargin = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : null;

  const placeOrder = (side) => {
    const id = posId.current++;
    const entry = side === "Buy" ? buy : sell;
    setPositions((p) => [
      { id, symbol: active.symbol, side, volume, entry, digits: active.digits },
      ...p,
    ]);
    setPosTab("Open");
    showToast(`${side} ${volume.toFixed(2)} ${active.symbol} at ${fmt(entry, active.digits)}`);
  };
  const closePosition = (id) => {
    setPositions((p) => p.filter((x) => x.id !== id));
    showToast("Position closed", "info");
  };
  const stepVol = (d) => setVolume((v) => Math.max(0.01, Math.round((v + d) * 100) / 100));

  return (
    <div className={cx(styles.terminal, standalone && styles.standalone, "animate-in")} translate="no">
      {/* ---- Symbol tab bar ---- */}
      <div className={styles.tabbar}>
        {standalone && (
          <Link href="/pa/trading/accounts" className={styles.brand} title="Back to Personal area">
            <Logo variant="mark" size={32} />
          </Link>
        )}
        <div className={styles.tabScroll}>
          {tabs.map((sym) => {
            const q = quotes.find((x) => x.symbol === sym);
            if (!q) return null;
            const on = sym === activeSymbol;
            return (
              <button
                key={sym}
                className={cx(styles.symTab, on && styles.symTabActive)}
                onClick={() => (standalone ? router.push("/pa/deposit") : setActiveSymbol(sym))}
              >
                <span className={styles.tabIcon} style={{ background: q.tone }}>
                  {q.icon}
                </span>
                <span className={styles.tabName}>{sym}</span>
                <span className={styles.tabClose} onClick={(e) => closeTab(sym, e)}>
                  <X size={12} />
                </span>
              </button>
            );
          })}
          <button className={styles.tabAdd} aria-label="Add symbol" onClick={() => showToast("Pick a symbol from the list", "info")}>
            <Plus size={16} />
          </button>
        </div>
        <div className={styles.topRight}>
          {standalone && (
            <Link href="/pa/trading/accounts" className={styles.paLink} title="Personal area">
              <LayoutGrid size={16} /> Personal area
            </Link>
          )}
          <div className={styles.accountChip}>
            <div className={styles.accMeta}>
              <span className={styles.accBadge}>Demo</span>
              <span className={styles.accType}>Standard</span>
            </div>
            <div className={styles.accBal}>
              {money(balance)}
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* ---- Body ---- */}
      <div className={styles.body}>
        {/* Instruments */}
        <aside className={styles.instruments}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>INSTRUMENTS</span>
            <span className={styles.panelActions}>
              <MoreHorizontal size={16} />
            </span>
          </div>
          <div className={styles.searchBox}>
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className={styles.searchInput}
            />
          </div>
          <button className={styles.favSelect}>
            Favorites <ChevronDown size={14} />
          </button>
          <div className={styles.instTable}>
            <div className={styles.instHeadRow}>
              <span>Symbol</span>
              <span className={styles.center}>Signal</span>
              <span className={styles.right}>Bid</span>
              <span className={styles.right}>Ask</span>
            </div>
            <div className={styles.instBody}>
              {filtered.map((i) => {
                const rowUp = i.live >= i.prev;
                const b = i.live - i.spread / 2;
                const a = i.live + i.spread / 2;
                return (
                  <button
                    key={i.symbol}
                    className={cx(styles.instRow, activeSymbol === i.symbol && styles.instRowActive)}
                    onClick={() => openSymbol(i.symbol)}
                  >
                    <span className={styles.instSym}>
                      <Grip size={12} className={styles.grip} />
                      <span className={styles.instIcon} style={{ background: i.tone }}>
                        {i.icon}
                      </span>
                      <span className={styles.instTicker}>{i.symbol}</span>
                    </span>
                    <span className={styles.center}>
                      <span className={cx(styles.signal, rowUp ? styles.sigUp : styles.sigDown)}>
                        {rowUp ? "▲" : "▼"}
                      </span>
                    </span>
                    <span className={cx(styles.right, styles.bid)}>{fmt(b, i.digits)}</span>
                    <span className={cx(styles.right, styles.ask)}>{fmt(a, i.digits)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Chart + positions */}
        <section className={styles.center2}>
          <div className={styles.chartToolbar}>
            <button className={styles.toolBtn}><Plus size={16} /></button>
            <div className={styles.tfGroup}>
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  className={cx(styles.tfBtn, tf === t && styles.tfActive)}
                  onClick={() => setTf(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className={styles.toolDiv} />
            {CHART_TOOLS.map((Ico, idx) => (
              <button key={idx} className={styles.toolBtn}>
                <Ico size={16} />
              </button>
            ))}
            <span className={styles.toolSpacer} />
            <button className={styles.toolBtn}><Camera size={16} /></button>
            <button className={styles.toolBtn}><Maximize2 size={16} /></button>
          </div>

          <div className={styles.chartTitle}>
            <span className={styles.chartName}>{active.name} · {tf}</span>
            <span className={styles.ohlc}>
              O <b>{fmt(candles[0]?.o || 0, active.digits)}</b>
              H <b>{fmt(Math.max(...candles.map((c) => c.h)), active.digits)}</b>
              L <b>{fmt(Math.min(...candles.map((c) => c.l)), active.digits)}</b>
              C <b className={up ? styles.upText : styles.downText}>{fmt(active.live, active.digits)}</b>
            </span>
          </div>

          <div className={styles.chartWrap}>
            <CandleChart candles={candles} digits={active.digits} up={up} />
          </div>

          <div className={styles.positions}>
            <div className={styles.posTabs}>
              {["Open", "Pending", "Closed"].map((t) => (
                <button
                  key={t}
                  className={cx(styles.posTab, posTab === t && styles.posTabActive)}
                  onClick={() => setPosTab(t)}
                >
                  {t}
                  {t === "Open" && positions.length > 0 && (
                    <span className={styles.posBadge}>{positions.length}</span>
                  )}
                </button>
              ))}
              <span className={styles.posTabsRight}>
                <Layers size={15} />
                <MoreHorizontal size={15} />
              </span>
            </div>

            {posTab === "Open" && positions.length > 0 ? (
              <div className={styles.posTableWrap}>
                <table className={styles.posTable}>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Volume</th>
                      <th>Open price</th>
                      <th>Current</th>
                      <th className={styles.right}>Profit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const q = quotes.find((x) => x.symbol === p.symbol) || active;
                      const pnl = pnlOf(p, q.live);
                      return (
                        <tr key={p.id}>
                          <td className={styles.posSym}>{p.symbol}</td>
                          <td>
                            <span className={cx(styles.posSide, p.side === "Buy" ? styles.buyTag : styles.sellTag)}>
                              {p.side.toLowerCase()}
                            </span>
                          </td>
                          <td>{p.volume.toFixed(2)}</td>
                          <td>{fmt(p.entry, p.digits)}</td>
                          <td>{fmt(q.live, p.digits)}</td>
                          <td className={cx(styles.right, pnl >= 0 ? styles.upText : styles.downText)}>
                            {pnl >= 0 ? "+" : "-"}
                            {money(Math.abs(pnl)).replace(" USD", "")}
                          </td>
                          <td className={styles.right}>
                            <button className={styles.closeBtn} onClick={() => closePosition(p.id)} aria-label="Close">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.posEmpty}>
                <Briefcase size={30} strokeWidth={1.4} />
                <span>No {posTab.toLowerCase()} positions</span>
              </div>
            )}
          </div>
        </section>

        {/* Order ticket */}
        <aside className={styles.ticket}>
          <div className={styles.ticketHead}>
            <span className={styles.ticketSym}>
              <span className={styles.instIcon} style={{ background: active.tone }}>
                {active.icon}
              </span>
              {active.symbol}
            </span>
            <button className={styles.toolBtn} aria-label="Close ticket"><X size={16} /></button>
          </div>

          <button className={styles.formSelect}>
            Regular form <ChevronDown size={15} />
          </button>

          <div className={styles.dealRow}>
            <button className={cx(styles.dealBox, styles.sellDeal)} onClick={() => placeOrder("Sell")}>
              <span className={styles.dealLabel}>Sell</span>
              <PriceTicker value={sell} digits={active.digits} className={styles.dealPrice} />
            </button>
            <div className={styles.spreadTag}>{fmt(active.spread, active.digits)}</div>
            <button className={cx(styles.dealBox, styles.buyDeal)} onClick={() => placeOrder("Buy")}>
              <span className={styles.dealLabel}>Buy</span>
              <PriceTicker value={buy} digits={active.digits} className={styles.dealPrice} />
            </button>
          </div>

          <div className={styles.sentiment}>
            <span className={styles.sentSell}>33%</span>
            <span className={styles.sentBar}>
              <span className={styles.sentFill} />
            </span>
            <span className={styles.sentBuy}>67%</span>
          </div>

          <div className={styles.orderTabs}>
            {["Market", "Pending"].map((t) => (
              <button
                key={t}
                className={cx(styles.orderTab, orderTab === t && styles.orderTabActive)}
                onClick={() => setOrderTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label className={styles.fieldLabel}>Volume</label>
          <div className={styles.stepRow}>
            <div className={styles.stepInput}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={volume}
                onChange={(e) => setVolume(Math.max(0.01, Number(e.target.value) || 0.01))}
              />
              <span className={styles.unit}>Lots</span>
            </div>
            <button className={styles.stepBtn} onClick={() => stepVol(-0.01)}><Minus size={15} /></button>
            <button className={styles.stepBtn} onClick={() => stepVol(0.01)}><Plus size={15} /></button>
          </div>

          <label className={styles.fieldLabel}>
            Take Profit <HelpCircle size={13} className={styles.q} />
          </label>
          <div className={styles.stepRow}>
            <div className={styles.stepInput}>
              <span className={styles.notSet}>Not set</span>
              <span className={styles.unit}>Price <ChevronDown size={12} /></span>
            </div>
            <button className={styles.stepBtn}><Minus size={15} /></button>
            <button className={styles.stepBtn}><Plus size={15} /></button>
          </div>

          <label className={styles.fieldLabel}>
            Stop Loss <HelpCircle size={13} className={styles.q} />
          </label>
          <div className={styles.stepRow}>
            <div className={styles.stepInput}>
              <span className={styles.notSet}>Not set</span>
              <span className={styles.unit}>Price <ChevronDown size={12} /></span>
            </div>
            <button className={styles.stepBtn}><Minus size={15} /></button>
            <button className={styles.stepBtn}><Plus size={15} /></button>
          </div>
        </aside>
      </div>

      {/* ---- Status bar ---- */}
      <div className={styles.statusbar}>
        <span><i>Equity:</i> {money(equity)}</span>
        <span><i>Free Margin:</i> {money(freeMargin)}</span>
        <span><i>Balance:</i> {money(balance)}</span>
        <span><i>Margin:</i> {money(usedMargin)}</span>
        <span><i>Margin level:</i> {marginLevel ? `${marginLevel.toFixed(0)}%` : "-"}</span>
      </div>
    </div>
  );
}
