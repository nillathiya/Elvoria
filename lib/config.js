// ============================================================
//  Static application config.
//
//  This is what survived lib/mockData.js: real, non-fabricated values the UI
//  needs. No fake users, balances, accounts, transactions or market data —
//  everything the app shows about a person or a transaction now comes from
//  storage or from the blockchain.
// ============================================================

export const BRAND = "Elvoria";
export const DOMAIN = "elvoria.com";
export const SUPPORT_EMAIL = "support@elvoria.com";

// Used by the registration form's phone/country selector.
export const countries = [
  { code: "US", flag: "🇺🇸", name: "United States", dial: "+1" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", dial: "+44" },
  { code: "AE", flag: "🇦🇪", name: "United Arab Emirates", dial: "+971" },
  { code: "IN", flag: "🇮🇳", name: "India", dial: "+91" },
  { code: "DE", flag: "🇩🇪", name: "Germany", dial: "+49" },
  { code: "FR", flag: "🇫🇷", name: "France", dial: "+33" },
  { code: "SG", flag: "🇸🇬", name: "Singapore", dial: "+65" },
  { code: "AU", flag: "🇦🇺", name: "Australia", dial: "+61" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria", dial: "+234" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", dial: "+27" },
];

// Display helper for fiat-style amounts.
//
// Deliberately NOT for crypto amounts: spec §18 requires raw blockchain values
// to stay strings and never touch a JS float, which this does. Render token
// amounts as the strings the verifier returns.
export function formatMoney(value, currency = "USD") {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}${symbol}${formatted}`;
}

// Maps a transaction status (spec §17) to a Badge variant.
export function statusVariant(status) {
  if (status === "verified") return "success";
  if (status === "pending_confirmations" || status === "verifying") return "warning";
  if (status === "rejected" || status === "failed" || status === "already_used") return "error";
  return "neutral";
}

// ============================================================
//  First-deposit promotion (client-side display).
//
//  A single source of truth for the deposit offer so the UserShell banner and
//  the /pa/deposit calculator can never drift apart. These are a promotional
//  ESTIMATE shown to the user; the real crypto amount received is whatever the
//  chain confirms at verify time (spec §16-18). Nothing here writes a balance.
// ============================================================

// Every deposit is quoted to be worth at least this many USD, regardless of
// which coin is chosen — the crypto minimum is derived live from market price.
export const MIN_DEPOSIT_USD = 100;

// Tiered bonus on the first deposit. A deposit qualifies for the highest tier
// whose threshold it meets (e.g. $600 → +20%).
export const DEPOSIT_BONUS_TIERS = [
  { minUsd: 100, pct: 10 },
  { minUsd: 500, pct: 20 },
  { minUsd: 1000, pct: 30 },
  { minUsd: 2500, pct: 40 },
  { minUsd: 5000, pct: 50 },
];

// The bonus percentage a given USD deposit earns (0 below the minimum).
export function bonusPctForUsd(usd) {
  const amount = Number(usd) || 0;
  let pct = 0;
  for (const tier of DEPOSIT_BONUS_TIERS) {
    if (amount >= tier.minUsd) pct = tier.pct;
  }
  return pct;
}

// CoinGecko ids for the coins we price live. Stablecoins are pinned to $1 and
// never queried — their USD value is fixed by definition.
export const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  TRX: "tron",
};
export const STABLE_SYMBOLS = ["USDT", "USDC"];

// Sensible display precision per coin for an estimated on-chain amount.
export function cryptoDecimals(symbol) {
  if (symbol === "BTC") return 6;
  if (symbol === "ETH") return 5;
  if (symbol === "BNB") return 4;
  if (symbol === "TRX") return 2;
  return 2; // stablecoins and anything else
}
