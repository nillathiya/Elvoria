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
