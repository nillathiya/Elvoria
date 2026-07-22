// ============================================================
//  Same-origin proxy for TrueFX real-time FX quotes.
//
//  TrueFX streams sub-second bid/ask but sends NO CORS header, so a browser
//  cannot call it directly (it would be blocked). This route fetches it
//  server-side — where CORS does not apply — and hands the client clean JSON
//  from our own origin, so the browser call is never blocked. Free, no key.
//
//  A short in-process cache means many client polls (and many visitors) collapse
//  to at most one upstream request every couple of seconds.
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD"];
const TRUEFX_URL = `https://webrates.truefx.com/rates/connect.html?f=csv&c=${PAIRS.join(",")}`;
const CACHE_MS = 2000;

// Module-scoped cache. This server runs as a long-lived node process
// (npm start), so it persists across requests.
let cache = { at: 0, pairs: null };

// TrueFX CSV row:
//   Symbol,Timestamp,Bid.big,Bid.points,Ask.big,Ask.points,Range1,Range2,Open
// Bid/ask are split into a "big figure" and "points" that concatenate into the
// full number ("1.14" + "118" -> 1.14118). The two range columns are the day's
// high/low in an inconsistent order, so we min/max them rather than trust it.
function parseRow(line) {
  const f = line.split(",");
  if (f.length < 9) return null;
  const bid = parseFloat(f[2] + f[3]);
  const ask = parseFloat(f[4] + f[5]);
  const r1 = parseFloat(f[6]);
  const r2 = parseFloat(f[7]);
  const open = parseFloat(f[8]);
  if (![bid, ask, open].every(Number.isFinite)) return null;
  return {
    symbol: f[0],
    bid,
    ask,
    high: Math.max(r1, r2),
    low: Math.min(r1, r2),
    open,
    change: open ? ((bid - open) / open) * 100 : 0,
    ts: Number(f[1]) || null,
  };
}

export async function GET() {
  const now = Date.now();
  if (cache.pairs && now - cache.at < CACHE_MS) {
    return Response.json({ ok: true, pairs: cache.pairs, asOf: cache.at, cached: true });
  }

  try {
    const res = await fetch(TRUEFX_URL, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (Elvoria FX widget)" },
    });
    if (!res.ok) throw new Error(`TrueFX ${res.status}`);
    const text = await res.text();
    const pairs = text
      .trim()
      .split("\n")
      .map((l) => parseRow(l.trim()))
      .filter(Boolean)
      .filter((p) => PAIRS.includes(p.symbol));
    if (!pairs.length) throw new Error("no rows");

    cache = { at: now, pairs };
    return Response.json({ ok: true, pairs, asOf: now });
  } catch (e) {
    // Prefer serving the last good snapshot over an error (e.g. a weekend when
    // the market is closed and the feed is quiet, or a transient upstream blip).
    if (cache.pairs) {
      return Response.json({ ok: true, pairs: cache.pairs, asOf: cache.at, stale: true });
    }
    return Response.json({ ok: false, error: "FX feed unavailable" }, { status: 502 });
  }
}
